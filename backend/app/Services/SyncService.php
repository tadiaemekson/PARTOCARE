<?php
 
namespace App\Services;
 
use App\Models\Patient;
use App\Models\Pregnancy;
use App\Models\Facility;
use App\Models\User;
use App\Models\Labour;
use App\Models\Partogram;
use App\Models\PartogramEntry;
use App\Models\Referral;
use App\Models\Ambulance;
use App\Models\Alert;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
 
class SyncService
{
    protected $alertEngine;
 
    public function __construct(AlertEngineService $alertEngine)
    {
        $this->alertEngine = $alertEngine;
    }
 
    /**
     * Process a batch of sync queue items.
     * Returns an array detailing processed results and errors.
     *
     * @param array $batch
     * @return array
     */
    public function processBatch(array $batch): array
    {
        $results = [];
        $errors = [];
 
        foreach ($batch as $index => $item) {
            $action = $item['action'] ?? null;
            $payload = $item['payload'] ?? [];
            $itemId = $item['id'] ?? $index;
 
            try {
                DB::transaction(function () use ($action, $payload) {
                    switch ($action) {
                        case 'CREATE_FACILITY':
                            $exists = Facility::where('name', $payload['name'])
                                ->where('latitude', $payload['latitude'])
                                ->where('longitude', $payload['longitude'])
                                ->exists();
                            if ($exists) {
                                throw new \Exception("Une structure avec ce nom et ces coordonnées GPS existe déjà.");
                            }
                            Facility::firstOrCreate(['id' => $payload['id']], $payload);
                            break;

                        case 'CREATE_USER':
                            if (isset($payload['password'])) {
                                $payload['password'] = \Illuminate\Support\Facades\Hash::make($payload['password']);
                            }
                            User::firstOrCreate(['id' => $payload['id']], $payload);
                            break;

                        case 'UPDATE_FACILITY':
                            if (isset($payload['name']) || isset($payload['latitude']) || isset($payload['longitude'])) {
                                $current = Facility::find($payload['id']);
                                if ($current) {
                                    $testName = $payload['name'] ?? $current->name;
                                    $testLat = $payload['latitude'] ?? $current->latitude;
                                    $testLng = $payload['longitude'] ?? $current->longitude;

                                    $exists = Facility::where('name', $testName)
                                        ->where('latitude', $testLat)
                                        ->where('longitude', $testLng)
                                        ->where('id', '!=', $payload['id'])
                                        ->exists();
                                    if ($exists) {
                                        throw new \Exception("Une structure avec ce nom et ces coordonnées GPS existe déjà.");
                                    }
                                }
                            }
                            Facility::where('id', $payload['id'])->update($payload);
                            break;

                        case 'DELETE_FACILITY':
                            Facility::where('id', $payload['id'])->delete();
                            break;

                        case 'UPDATE_USER':
                            if (isset($payload['password'])) {
                                $payload['password'] = \Illuminate\Support\Facades\Hash::make($payload['password']);
                            }
                            User::where('id', $payload['id'])->update($payload);
                            break;

                        case 'DELETE_USER':
                            User::where('id', $payload['id'])->delete();
                            break;

                        case 'CREATE_PATIENT':
                            Patient::firstOrCreate(['id' => $payload['id']], $payload);
                            break;
 
                        case 'CREATE_PREGNANCY':
                            Pregnancy::firstOrCreate(['id' => $payload['id']], $payload);
                            break;
 
                        case 'START_LABOUR':
                            // Contains both labour and partogram keys in payload
                            if (isset($payload['labour'])) {
                                Labour::firstOrCreate(['id' => $payload['labour']['id']], $payload['labour']);
                            }
                            if (isset($payload['partogram'])) {
                                Partogram::firstOrCreate(['id' => $payload['partogram']['id']], $payload['partogram']);
                            }
                            break;
 
                        case 'ADD_ENTRY':
                            // payload contains entry and alerts
                            $entryData = $payload['entry'] ?? null;
                            if ($entryData) {
                                $entry = PartogramEntry::firstOrCreate(['id' => $entryData['id']], $entryData);
                                
                                // Process the saved/triggered alerts in sync
                                $alertsData = $payload['alerts'] ?? [];
                                foreach ($alertsData as $alertData) {
                                    Alert::firstOrCreate(['id' => $alertData['id']], $alertData);
                                }
                            }
                            break;
 
                        case 'CREATE_REFERRAL':
                            Referral::firstOrCreate(['id' => $payload['id']], $payload);
                            // Update labour status as well
                            if (isset($payload['labour_id'])) {
                                Labour::where('id', $payload['labour_id'])->update(['labour_status' => 'TRANSFERRED']);
                            }
                            break;
 
                        case 'ASSIGN_AMBULANCE':
                            $referralId = $payload['referralId'] ?? null;
                            $ambulanceId = $payload['ambulanceId'] ?? null;
                            $departureTime = $payload['departure_time'] ?? null;
 
                            if ($referralId) {
                                Referral::where('id', $referralId)->update([
                                    'referral_status' => 'IN_TRANSIT',
                                    'departure_time' => $departureTime,
                                    'ambulance_id' => $ambulanceId
                                ]);
                            }
                            if ($ambulanceId) {
                                Ambulance::where('id', $ambulanceId)->update(['status' => 'en mission']);
                            }
                            break;
 
                        case 'RESOLVE_ALERT':
                            $alertId = $payload['alertId'] ?? null;
                            $resolvedAt = $payload['resolvedAt'] ?? null;
                            if ($alertId) {
                                Alert::where('id', $alertId)->update(['resolved_at' => $resolvedAt]);
                            }
                            break;

                        case 'UPDATE_REFERRAL_STATUS':
                            $referralId = $payload['referralId'] ?? null;
                            $status = $payload['status'] ?? null;
                            $arrivalTime = $payload['arrival_time'] ?? null;
                            if ($referralId && $status) {
                                $referral = Referral::find($referralId);
                                if ($referral) {
                                    $updates = ['referral_status' => $status];
                                    if ($status === 'ADMITTED') {
                                        $updates['arrival_time'] = $arrivalTime ?: now()->toDateTimeString();
                                        Labour::where('id', $referral->labour_id)->update([
                                            'labour_status' => 'COMPLETED',
                                            'outcome' => 'HEALTHY_MOU'
                                        ]);
                                        if ($referral->ambulance_id) {
                                            Ambulance::where('id', $referral->ambulance_id)->update(['status' => 'available']);
                                        }
                                    } elseif ($status === 'DECLINED') {
                                        Labour::where('id', $referral->labour_id)->update([
                                            'labour_status' => 'ACTIVE'
                                        ]);
                                    }
                                    $referral->update($updates);
                                }
                            }
                            break;
 
                        default:
                            throw new \Exception("Unsupported sync action: {$action}");
                    }
                });
 
                $results[] = [
                    'id' => $itemId,
                    'status' => 'SUCCESS'
                ];
            } catch (\Exception $e) {
                Log::error("Failed to sync item {$itemId}: " . $e->getMessage());
                $errors[] = [
                    'id' => $itemId,
                    'error' => $e->getMessage()
                ];
            }
        }
 
        return [
            'success' => count($errors) === 0,
            'processed' => $results,
            'errors' => $errors
        ];
    }
}
