<?php
 
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\LabourController;
use App\Http\Controllers\PartogramController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;
 
Route::prefix('v1')->group(function () {
    // Public authentication endpoint
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Temporary debug endpoint to check seeded users
    Route::get('/debug-users', function() {
        return \App\Models\User::all(['id', 'first_name', 'last_name', 'email', 'role_id']);
    });
 
    // Protected clinical endpoints
    Route::middleware('auth:sanctum')->group(function () {
        // Patients and pregnancies profiling
        Route::post('/patients', [PatientController::class, 'create']);
        Route::post('/patients/{patient_id}/pregnancies', [PatientController::class, 'createPregnancy']);
 
        // Active labor sessions
        Route::post('/labours', [LabourController::class, 'create']);
 
        // Clinical observations & partogram details
        Route::get('/partograms/{id}', [PartogramController::class, 'getPartogram']);
        Route::post('/partograms/{id}/entries', [PartogramController::class, 'createEntry']);
 
        // Outbound referrals and vehicle coordination
        Route::post('/referrals', [ReferralController::class, 'initiate']);
        Route::post('/referrals/{id}/assign-ambulance', [ReferralController::class, 'assignAmbulance']);
        Route::put('/referrals/{id}/status', [ReferralController::class, 'updateStatus']);
 
        // Clinician dashboard KPIs
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
 
        // Offline synchronization batch outbox
        Route::post('/sync', [SyncController::class, 'sync']);
    });
});
