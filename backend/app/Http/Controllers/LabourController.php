<?php
 
namespace App\Http\Controllers;
 
use App\Models\Labour;
use App\Models\Partogram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
 
class LabourController extends Controller
{
    /**
     * Start a new labour session and initialize the partogram.
     */
    public function create(Request $request)
    {
        $request->validate([
            'pregnancy_id' => 'required|string|max:36|exists:pregnancies,id',
            'facility_id' => 'required|string|max:36|exists:facilities,id',
            'admission_datetime' => 'required|date',
        ]);
 
        $admittedBy = auth()->id() ?? User::first()->id; // Fallback for debugging
 
        $admissionDatetime = Carbon::parse($request->admission_datetime);
 
        $result = DB::transaction(function () use ($request, $admittedBy, $admissionDatetime) {
            $labour = Labour::create([
                'pregnancy_id' => $request->pregnancy_id,
                'facility_id' => $request->facility_id,
                'admitted_by' => $admittedBy,
                'admission_datetime' => $admissionDatetime->toDateTimeString(),
                'labour_status' => 'ACTIVE'
            ]);
 
            $partogram = Partogram::create([
                'labour_id' => $labour->id,
                'started_at' => $admissionDatetime->toDateTimeString(),
                'status' => 'ACTIVE'
            ]);
 
            return [
                'labour' => $labour,
                'partogram' => $partogram
            ];
        });
 
        $labour = $result['labour'];
        $partogram = $result['partogram'];
 
        return response()->json([
            'id' => $labour->id,
            'pregnancy_id' => $labour->pregnancy_id,
            'facility_id' => $labour->facility_id,
            'admission_datetime' => $labour->admission_datetime->toDateTimeString(),
            'labour_status' => $labour->labour_status,
            'partogram' => [
                'id' => $partogram->id,
                'started_at' => $partogram->started_at->toDateTimeString(),
            ]
        ], 201);
    }
}
