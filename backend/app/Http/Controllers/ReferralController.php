<?php
 
namespace App\Http\Controllers;
 
use App\Models\Referral;
use App\Models\Labour;
use App\Models\Ambulance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
 
class ReferralController extends Controller
{
    /**
     * Initiate an emergency obstetrical referral.
     */
    public function initiate(Request $request)
    {
        $request->validate([
            'labour_id' => 'required|string|max:36|exists:labours,id',
            'source_facility_id' => 'required|string|max:36|exists:facilities,id',
            'destination_facility_id' => 'required|string|max:36|exists:facilities,id',
            'reason' => 'nullable|string',
            'referral_reason' => 'nullable|string',
        ]);
 
        $initiatedBy = auth()->id() ?? User::first()->id; // Fallback
 
        $reason = $request->input('referral_reason') ?? $request->input('reason') ?? 'Alerte clinique sur le partogramme.';
 
        $referral = DB::transaction(function () use ($request, $initiatedBy, $reason) {
            // 1. Create referral
            $ref = Referral::create([
                'labour_id' => $request->labour_id,
                'source_facility_id' => $request->source_facility_id,
                'destination_facility_id' => $request->destination_facility_id,
                'initiated_by' => $initiatedBy,
                'reason' => $reason,
                'referral_status' => 'PENDING',
            ]);
 
            // 2. Mark labour status as transferred
            Labour::where('id', $request->labour_id)->update([
                'labour_status' => 'TRANSFERRED'
            ]);
 
            return $ref;
        });
 
        return response()->json([
            'id' => $referral->id,
            'labour_id' => $referral->labour_id,
            'source_facility_id' => $referral->source_facility_id,
            'destination_facility_id' => $referral->destination_facility_id,
            'referral_reason' => $referral->reason,
            'referral_status' => $referral->referral_status,
        ], 201);
    }
 
    /**
     * Assign an ambulance to an active referral.
     */
    public function assignAmbulance(Request $request, $id)
    {
        $referral = Referral::findOrFail($id);
 
        $request->validate([
            'ambulance_id' => 'required|string|max:36|exists:ambulances,id',
        ]);
 
        $ambulance = Ambulance::findOrFail($request->ambulance_id);
 
        DB::transaction(function () use ($referral, $ambulance) {
            // Update referral
            $referral->update([
                'referral_status' => 'IN_TRANSIT',
                'departure_time' => Carbon::now()->toDateTimeString(),
                'ambulance_id' => $ambulance->id,
            ]);
 
            // Update ambulance status to "en mission"
            $ambulance->update([
                'status' => 'en mission'
            ]);
        });
 
        return response()->json([
            'referral_id' => $referral->id,
            'referral_status' => 'IN_TRANSIT',
            'assigned_ambulance' => [
                'id' => $ambulance->id,
                'registration_number' => $ambulance->registration_number,
                'driver_name' => $ambulance->driver_name,
                'driver_phone' => $ambulance->driver_phone,
            ]
        ]);
    }
 
    /**
     * Update referral status (e.g. ACCEPTED, DECLINED, ADMITTED)
     */
    public function updateStatus(Request $request, $id)
    {
        $referral = Referral::findOrFail($id);
 
        $request->validate([
            'status' => 'required|string|in:PENDING,ACCEPTED,IN_TRANSIT,ADMITTED,DECLINED',
        ]);
 
        $status = $request->status;
 
        DB::transaction(function () use ($referral, $status) {
            $updates = ['referral_status' => $status];
 
            if ($status === 'ADMITTED') {
                $updates['arrival_time'] = Carbon::now()->toDateTimeString();
                
                // Complete/Discharge the labor session locally as well
                Labour::where('id', $referral->labour_id)->update([
                    'labour_status' => 'COMPLETED',
                    'outcome' => 'HEALTHY_MOU' // default outcome post admission
                ]);
 
                // Free up the assigned ambulance
                if ($referral->ambulance_id) {
                    Ambulance::where('id', $referral->ambulance_id)->update([
                        'status' => 'available'
                    ]);
                }
            } elseif ($status === 'DECLINED') {
                // If declined, reset labour status to ACTIVE to allow another transfer attempt
                Labour::where('id', $referral->labour_id)->update([
                    'labour_status' => 'ACTIVE'
                ]);
            }
 
            $referral->update($updates);
        });
 
        return response()->json($referral);
    }
}
