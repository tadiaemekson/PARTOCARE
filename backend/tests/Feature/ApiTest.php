<?php
 
namespace Tests\Feature;
 
use App\Models\User;
use App\Models\Patient;
use App\Models\Pregnancy;
use App\Models\Labour;
use App\Models\Partogram;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;
 
class ApiTest extends TestCase
{
    use RefreshDatabase; // Run migrations and clear DB before each test
 
    protected function setUp(): void
    {
        parent::setUp();
        // Seed initial roles/facilities/users
        $this->seed();
    }
 
    /**
     * Test public login endpoint.
     */
    public function test_auth_login_with_valid_credentials()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'sagefemme@partocare.cm',
            'password' => 'password'
        ]);
 
        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'role' => ['id', 'name'],
                    'facility' => ['id', 'name', 'type']
                ]
            ]);
    }
 
    public function test_auth_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'sagefemme@partocare.cm',
            'password' => 'wrong-password'
        ]);
 
        $response->assertStatus(401);
    }
 
    /**
     * Test protected endpoints.
     */
    public function test_protected_routes_refuse_unauthorized_requests()
    {
        $response = $this->getJson('/api/v1/dashboard/stats');
        $response->assertStatus(401);
    }
 
    public function test_full_clinical_workflow()
    {
        // 1. Log in and get Sanctum token
        $user = User::where('email', 'sagefemme@partocare.cm')->first();
        $token = $user->createToken('test-token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];
 
        // 2. Register Patient
        $patientResponse = $this->postJson('/api/v1/patients', [
            'first_name' => 'Jeanne',
            'last_name' => 'Ngo',
            'date_of_birth' => '1997-03-12',
            'phone' => '+237699999999',
            'address' => 'Ndiki Ville',
            'blood_group' => 'B+',
            'emergency_contact' => 'Albert Ngo (+237688888888)'
        ], $headers);
 
        $patientResponse->assertStatus(201);
        $patientId = $patientResponse->json('id');
        $this->assertNotEmpty($patientId);
 
        // 3. Register Pregnancy
        $pregnancyResponse = $this->postJson("/api/v1/patients/{$patientId}/pregnancies", [
            'gravidity' => 2,
            'parity' => 1,
            'estimated_delivery_date' => Carbon::now()->addDays(5)->toDateString(),
            'gestational_age_weeks' => 39,
            'risk_level' => 'LOW'
        ], $headers);
 
        $pregnancyResponse->assertStatus(201);
        $pregnancyId = $pregnancyResponse->json('id');
        $this->assertNotEmpty($pregnancyId);
 
        // 4. Start Labour Session
        $labourResponse = $this->postJson('/api/v1/labours', [
            'pregnancy_id' => $pregnancyId,
            'facility_id' => $user->facility_id,
            'admission_datetime' => Carbon::now()->toDateTimeString()
        ], $headers);
 
        $labourResponse->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'pregnancy_id',
                'admission_datetime',
                'labour_status',
                'partogram' => ['id', 'started_at']
            ]);
 
        $labourId = $labourResponse->json('id');
        $partogramId = $labourResponse->json('partogram.id');
        $this->assertNotEmpty($labourId);
        $this->assertNotEmpty($partogramId);
 
        // 5. Add a normal Partogram Entry
        $normalEntryResponse = $this->postJson("/api/v1/partograms/{$partogramId}/entries", [
            'observation_time' => Carbon::now()->toDateTimeString(),
            'cervical_dilation' => 4.5,
            'fetal_heart_rate' => 140,
            'contractions_per_10min' => 2,
            'contraction_duration_secs' => 15,
            'maternal_temperature' => 37.0,
            'maternal_pulse' => 80,
            'blood_pressure' => '120/80',
            'fetal_station' => 4,
            'membrane_status' => 'INTACT',
            'amniotic_fluid_status' => 'NONE',
            'notes' => 'T=0 entry'
        ], $headers);
 
        $normalEntryResponse->assertStatus(201);
        $this->assertCount(0, $normalEntryResponse->json('triggered_alerts'));
 
        // 6. Add an entry that triggers FCF and Temperature alerts
        $alertEntryResponse = $this->postJson("/api/v1/partograms/{$partogramId}/entries", [
            'observation_time' => Carbon::now()->addHours(2)->toDateTimeString(),
            'cervical_dilation' => 4.5, // Dilation hasn't progressed in 2h (will trigger RED STAGNATION alert)
            'fetal_heart_rate' => 95,  // FHR < 110 (will trigger RED FCF alert)
            'contractions_per_10min' => 3,
            'contraction_duration_secs' => 35,
            'maternal_temperature' => 38.5, // Temp > 38.0 (will trigger ORANGE TEMP alert)
            'maternal_pulse' => 105,
            'blood_pressure' => '145/95', // BP >= 140/90 (will trigger ORANGE BP alert)
            'fetal_station' => 4,
            'membrane_status' => 'RUPTURED',
            'amniotic_fluid_status' => 'MECONIUM',
            'notes' => 'T=2 entry with complications'
        ], $headers);
 
        $alertEntryResponse->assertStatus(201);
        $triggeredAlerts = $alertEntryResponse->json('triggered_alerts');
        
        // Assert that clinical alerts are correctly generated by our Alert Engine
        $this->assertGreaterThanOrEqual(2, count($triggeredAlerts));
 
        $alertTypes = collect($triggeredAlerts)->pluck('alert_type')->toArray();
        $this->assertContains('FCF', $alertTypes);
        $this->assertContains('TEMPERATURE', $alertTypes);
        $this->assertContains('BP', $alertTypes);
        $this->assertContains('STAGNATION', $alertTypes);
 
        // 7. Check Dashboard statistics show the active labour case and critical status
        $statsResponse = $this->getJson('/api/v1/dashboard/stats', $headers);
        $statsResponse->assertStatus(200);
        $this->assertEquals(2, $statsResponse->json('summary.active_labours_count'));
        $this->assertEquals(1, $statsResponse->json('summary.critical_cases_count'));
    }
}
