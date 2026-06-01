<?php
 
namespace App\Http\Controllers;
 
use App\Models\Patient;
use App\Models\Pregnancy;
use Illuminate\Http\Request;
 
class PatientController extends Controller
{
    /**
     * Register a new patient.
     */
    public function create(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'date_of_birth' => 'required|date',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|max:5',
        ]);
 
        // Handle emergency contact input variations
        $emergencyName = $request->input('emergency_contact_name');
        $emergencyPhone = $request->input('emergency_contact_phone');
        if (empty($emergencyName) && $request->has('emergency_contact')) {
            $rawContact = $request->input('emergency_contact');
            // Try to extract name and phone in "Name (Phone)" format
            if (preg_match('/^(.*?)\s*\((.*?)\)$/', $rawContact, $matches)) {
                $emergencyName = trim($matches[1]);
                $emergencyPhone = trim($matches[2]);
            } else {
                $emergencyName = $rawContact;
                $emergencyPhone = $request->input('phone') ?? 'N/A'; // Fallback
            }
        }
 
        // Handle hospital number / patient code variations
        $patientCode = $request->input('patient_code') 
            ?? $request->input('hospital_number') 
            ?? ('PT-2026-' . rand(1000, 9999));
 
        $patient = Patient::create([
            'patient_code' => $patientCode,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'date_of_birth' => $request->date_of_birth,
            'phone' => $request->phone,
            'address' => $request->address,
            'blood_group' => $request->blood_group,
            'emergency_contact_name' => $emergencyName ?? 'N/A',
            'emergency_contact_phone' => $emergencyPhone ?? 'N/A',
        ]);
 
        return response()->json($patient, 201);
    }
 
    /**
     * Register a pregnancy profile for a patient.
     */
    public function createPregnancy(Request $request, $patientId)
    {
        $patient = Patient::findOrFail($patientId);
 
        $request->validate([
            'gravidity' => 'required|integer',
            'parity' => 'required|integer',
            'estimated_delivery_date' => 'nullable|date',
            'gestational_age' => 'nullable|integer',
            'gestational_age_weeks' => 'nullable|integer',
            'risk_level' => 'nullable|string|in:LOW,MEDIUM,HIGH',
        ]);
 
        $gestationalAge = $request->input('gestational_age_weeks') ?? $request->input('gestational_age');
 
        $pregnancy = Pregnancy::create([
            'patient_id' => $patient->id,
            'gravidity' => $request->gravidity,
            'parity' => $request->parity,
            'estimated_delivery_date' => $request->estimated_delivery_date,
            'gestational_age_weeks' => $gestationalAge,
            'risk_level' => $request->input('risk_level', 'LOW'),
            'status' => 'ACTIVE',
        ]);
 
        return response()->json($pregnancy, 201);
    }
}
