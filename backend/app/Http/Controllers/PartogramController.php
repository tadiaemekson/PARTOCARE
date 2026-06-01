<?php
 
namespace App\Http\Controllers;
 
use App\Models\Partogram;
use App\Models\PartogramEntry;
use App\Models\Alert;
use App\Services\AlertEngineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
 
class PartogramController extends Controller
{
    protected $alertEngine;
 
    public function __construct(AlertEngineService $alertEngine)
    {
        $this->alertEngine = $alertEngine;
    }
 
    /**
     * Get the complete partogram with all its entries.
     */
    public function getPartogram($partogramId)
    {
        $partogram = Partogram::with('entries')->findOrFail($partogramId);
        return response()->json($partogram);
    }
 
    /**
     * Append a clinical observation entry.
     */
    public function createEntry(Request $request, $partogramId)
    {
        $partogram = Partogram::findOrFail($partogramId);
 
        $request->validate([
            'observation_time' => 'required|date',
            'cervical_dilation' => 'required|numeric|min:0|max:10',
            'fetal_heart_rate' => 'required|integer|min:0',
            'contractions' => 'nullable|integer',
            'contractions_per_10min' => 'nullable|integer',
            'contraction_duration_secs' => 'nullable|integer',
            'duration' => 'nullable|integer',
            'maternal_temperature' => 'required|numeric|min:30|max:45',
            'maternal_pulse' => 'required|integer',
            'systolic_bp' => 'nullable|integer',
            'diastolic_bp' => 'nullable|integer',
            'blood_pressure' => 'nullable|string',
            'fetal_station' => 'required|integer|min:0|max:5',
            'membrane_status' => 'required|string|in:INTACT,RUPTURED',
            'amniotic_fluid_status' => 'required|string|in:CLEAR,MECONIUM,BLOOD,NONE',
            'notes' => 'nullable|string',
        ]);
 
        // Resolve contractions mappings
        $contractions = $request->input('contractions_per_10min') 
            ?? $request->input('contractions') 
            ?? 0;
            
        $duration = $request->input('contraction_duration_secs') 
            ?? $request->input('duration') 
            ?? 0;
 
        // Resolve blood pressure mappings (support both split inputs and combined "120/80" string)
        $systolic = $request->input('systolic_bp');
        $diastolic = $request->input('diastolic_bp');
        if ((empty($systolic) || empty($diastolic)) && $request->has('blood_pressure')) {
            $bp = $request->input('blood_pressure');
            if (preg_match('/^(\d+)\/(\d+)$/', $bp, $matches)) {
                $systolic = (int) $matches[1];
                $diastolic = (int) $matches[2];
            }
        }
 
        // Fallback default vitals values if missing
        $systolic = $systolic ?? 120;
        $diastolic = $diastolic ?? 80;
 
        $entryTime = Carbon::parse($request->observation_time);
 
        $result = DB::transaction(function () use ($partogram, $request, $entryTime, $contractions, $duration, $systolic, $diastolic) {
            $entry = PartogramEntry::create([
                'partogram_id' => $partogram->id,
                'observation_time' => $entryTime->toDateTimeString(),
                'cervical_dilation' => $request->cervical_dilation,
                'fetal_heart_rate' => $request->fetal_heart_rate,
                'contractions_per_10min' => $contractions,
                'contraction_duration_secs' => $duration,
                'maternal_temperature' => $request->maternal_temperature,
                'maternal_pulse' => $request->maternal_pulse,
                'systolic_bp' => $systolic,
                'diastolic_bp' => $diastolic,
                'fetal_station' => $request->fetal_station,
                'membrane_status' => $request->membrane_status,
                'amniotic_fluid_status' => $request->amniotic_fluid_status,
                'notes' => $request->notes,
            ]);
 
            // Evaluate clinical rules using our Alert Engine
            $alertsData = $this->alertEngine->evaluate($entry);
            
            $triggeredAlerts = [];
            foreach ($alertsData as $alertData) {
                $triggeredAlerts[] = Alert::create($alertData);
            }
 
            return [
                'entry' => $entry,
                'triggered_alerts' => $triggeredAlerts
            ];
        });
 
        return response()->json([
            'entry' => [
                'id' => $result['entry']->id,
                'partogram_id' => $result['entry']->partogram_id,
                'observation_time' => $result['entry']->observation_time->toDateTimeString(),
                'cervical_dilation' => (float) $result['entry']->cervical_dilation,
                'fetal_heart_rate' => $result['entry']->fetal_heart_rate,
            ],
            'triggered_alerts' => collect($result['triggered_alerts'])->map(function($alert) {
                return [
                    'id' => $alert->id,
                    'labour_id' => $alert->labour_id,
                    'alert_level' => $alert->alert_level,
                    'alert_type' => $alert->alert_type,
                    'alert_message' => $alert->alert_message,
                    'generated_at' => $alert->generated_at->toDateTimeString(),
                ];
            })
        ], 201);
    }
}
