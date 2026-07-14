<?php
 
namespace Database\Seeders;
 
use App\Models\Role;
use App\Models\Facility;
use App\Models\User;
use App\Models\Ambulance;
use App\Models\Patient;
use App\Models\Pregnancy;
use App\Models\Labour;
use App\Models\Partogram;
use App\Models\PartogramEntry;
use App\Models\Alert;
use App\Models\Referral;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
 
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['id' => 'r-midwife', 'name' => 'MIDWIFE', 'description' => 'Sage-femme : Saisie partogramme, alertes, transferts'],
            ['id' => 'r-nurse', 'name' => 'NURSE', 'description' => 'Infirmier : Aide et saisie de constantes sous supervision'],
            ['id' => 'r-physician', 'name' => 'PHYSICIAN', 'description' => 'Médecin : Validation clinique, prescriptions, référence'],
            ['id' => 'r-gynecologist', 'name' => 'GYNECOLOGIST', 'description' => 'Gynécologue : Gestion des urgences obstétricales'],
            ['id' => 'r-manager', 'name' => 'MATERNITY_MANAGER', 'description' => 'Responsable Maternité : Planification et KPIs'],
            ['id' => 'r-admin', 'name' => 'SYSTEM_ADMIN', 'description' => 'Administrateur : Configuration globale et sécurité'],
            ['id' => 'r-district', 'name' => 'DISTRICT_ADMIN', 'description' => 'District Sanitaire : Rapports agrégés du district']
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['id' => $role['id']], $role);
        }
 
        // 2. Facilities
        $facilities = [
            [
                'id' => 'fac-ndiki',
                'name' => 'CMA de Ndiki',
                'type' => 'CMA',
                'region' => 'Centre',
                'district' => 'Bafia',
                'address' => 'Ndiki Ville, Cameroun',
                'phone' => '+237622114455',
                'latitude' => 4.6738,
                'longitude' => 11.2334
            ],
            [
                'id' => 'fac-bafia',
                'name' => 'Hôpital de District de Bafia',
                'type' => 'District Hospital',
                'region' => 'Centre',
                'district' => 'Bafia',
                'address' => 'Quartier Administratif, Bafia',
                'phone' => '+237622116677',
                'latitude' => 4.7500,
                'longitude' => 11.2333
            ],
            [
                'id' => 'fac-yaounde',
                'name' => 'Hôpital Central de Yaoundé',
                'type' => 'Regional Hospital',
                'region' => 'Centre',
                'district' => 'Mfoundi',
                'address' => 'Ntoungou, Yaoundé',
                'phone' => '+237222234020',
                'latitude' => 3.8667,
                'longitude' => 11.5167
            ]
        ];
        foreach ($facilities as $fac) {
            Facility::firstOrCreate(['id' => $fac['id']], $fac);
        }
 
        // 3. Users (Password is 'password')
        $hashedPassword = Hash::make('password');
        $users = [
            ['id' => 'u-midwife', 'role_id' => 'r-midwife', 'facility_id' => 'fac-ndiki', 'first_name' => 'Marie', 'last_name' => 'Ngo Ndiki', 'phone' => '+237677112233', 'email' => 'sagefemme@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-nurse', 'role_id' => 'r-nurse', 'facility_id' => 'fac-ndiki', 'first_name' => 'Jean', 'last_name' => 'Ebolowa', 'phone' => '+237699334455', 'email' => 'infirmier@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-physician', 'role_id' => 'r-physician', 'facility_id' => 'fac-ndiki', 'first_name' => 'Pierre', 'last_name' => 'Atangana', 'phone' => '+237678123456', 'email' => 'medecin@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-gynecologist', 'role_id' => 'r-gynecologist', 'facility_id' => 'fac-bafia', 'first_name' => 'Luc', 'last_name' => 'Mebara', 'phone' => '+237699223344', 'email' => 'gynecologue@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-manager', 'role_id' => 'r-manager', 'facility_id' => 'fac-ndiki', 'first_name' => 'Chantal', 'last_name' => 'Bella', 'phone' => '+237655889900', 'email' => 'responsable@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-admin', 'role_id' => 'r-admin', 'facility_id' => 'fac-yaounde', 'first_name' => 'Emekson', 'last_name' => 'Tadia', 'phone' => '+237699999999', 'email' => 'tadiaemekson@gmail.com', 'password' => $hashedPassword, 'status' => 'ACTIVE'],
            ['id' => 'u-district', 'role_id' => 'r-district', 'facility_id' => 'fac-bafia', 'first_name' => 'Gaston', 'last_name' => 'Eloundou', 'phone' => '+237677777777', 'email' => 'district@partocare.cm', 'password' => $hashedPassword, 'status' => 'ACTIVE']
        ];
        foreach ($users as $usr) {
            User::firstOrCreate(['id' => $usr['id']], $usr);
        }
 
        // 4. Ambulances
        $ambulances = [
            ['id' => 'amb-1', 'facility_id' => 'fac-bafia', 'registration_number' => 'LT-889-OA', 'driver_name' => "Samuel Eto'o", 'driver_phone' => '+237699999999', 'status' => 'available'],
            ['id' => 'amb-2', 'facility_id' => 'fac-ndiki', 'registration_number' => 'CE-452-BB', 'driver_name' => 'Marc-Vivien Foé', 'driver_phone' => '+237677777777', 'status' => 'en mission'],
            ['id' => 'amb-3', 'facility_id' => 'fac-yaounde', 'registration_number' => 'OU-112-AA', 'driver_name' => 'Rigobert Song', 'driver_phone' => '+237688888888', 'status' => 'maintenance']
        ];
        foreach ($ambulances as $amb) {
            Ambulance::firstOrCreate(['id' => $amb['id']], $amb);
        }
 
        // 5. Patient & Pregnancy 1 (Florence Ebanda - Active/Normal Labor)
        $patient1 = Patient::firstOrCreate(['id' => 'pat-ebanda'], [
            'patient_code' => 'PT-2026-9876',
            'first_name' => 'Florence',
            'last_name' => 'Ebanda',
            'date_of_birth' => '1998-05-15',
            'phone' => '+237677123456',
            'address' => 'Quartier 2, Ndiki',
            'blood_group' => 'O+',
            'emergency_contact_name' => 'Jean Ebanda',
            'emergency_contact_phone' => '+237699876543'
        ]);
 
        $preg1 = Pregnancy::firstOrCreate(['id' => 'preg-ebanda'], [
            'patient_id' => $patient1->id,
            'gravidity' => 3,
            'parity' => 2,
            'estimated_delivery_date' => Carbon::now()->addDays(2)->toDateString(),
            'gestational_age_weeks' => 39,
            'risk_level' => 'LOW',
            'status' => 'ACTIVE'
        ]);
 
        $labour1 = Labour::firstOrCreate(['id' => 'labour-ebanda'], [
            'pregnancy_id' => $preg1->id,
            'facility_id' => 'fac-ndiki',
            'admitted_by' => 'u-midwife',
            'admission_datetime' => Carbon::now()->subHours(5)->toDateTimeString(),
            'labour_status' => 'ACTIVE'
        ]);
 
        $part1 = Partogram::firstOrCreate(['id' => 'part-ebanda'], [
            'labour_id' => $labour1->id,
            'started_at' => Carbon::now()->subHours(5)->toDateTimeString(),
            'status' => 'ACTIVE'
        ]);
 
        // Entries for Florence
        $entries1 = [
            [
                'id' => 'ent-eb-1',
                'partogram_id' => $part1->id,
                'observation_time' => Carbon::now()->subHours(5)->toDateTimeString(),
                'cervical_dilation' => 4.0,
                'fetal_heart_rate' => 136,
                'contractions_per_10min' => 2,
                'contraction_duration_secs' => 18,
                'maternal_temperature' => 36.8,
                'maternal_pulse' => 76,
                'systolic_bp' => 115,
                'diastolic_bp' => 75,
                'fetal_station' => 4,
                'membrane_status' => 'INTACT',
                'amniotic_fluid_status' => 'NONE',
                'notes' => 'Admission en phase active. Patiente calme.'
            ],
            [
                'id' => 'ent-eb-2',
                'partogram_id' => $part1->id,
                'observation_time' => Carbon::now()->subHours(3)->toDateTimeString(),
                'cervical_dilation' => 6.0,
                'fetal_heart_rate' => 140,
                'contractions_per_10min' => 3,
                'contraction_duration_secs' => 32,
                'maternal_temperature' => 37.0,
                'maternal_pulse' => 80,
                'systolic_bp' => 120,
                'diastolic_bp' => 80,
                'fetal_station' => 3,
                'membrane_status' => 'INTACT',
                'amniotic_fluid_status' => 'NONE',
                'notes' => 'Progression normale de la dilatation. Contractions régulières.'
            ],
            [
                'id' => 'ent-eb-3',
                'partogram_id' => $part1->id,
                'observation_time' => Carbon::now()->subHours(1)->toDateTimeString(),
                'cervical_dilation' => 8.5,
                'fetal_heart_rate' => 138,
                'contractions_per_10min' => 4,
                'contraction_duration_secs' => 45,
                'maternal_temperature' => 36.9,
                'maternal_pulse' => 82,
                'systolic_bp' => 120,
                'diastolic_bp' => 80,
                'fetal_station' => 1,
                'membrane_status' => 'RUPTURED',
                'amniotic_fluid_status' => 'CLEAR',
                'notes' => 'Poche des eaux rompue spontanément. Liquide clair.'
            ]
        ];
        foreach ($entries1 as $ent) {
            PartogramEntry::firstOrCreate(['id' => $ent['id']], $ent);
        }
 
        // 6. Patient & Pregnancy 2 (Marie Ngo - High Risk / Stagnant / Referred Labor)
        $patient2 = Patient::firstOrCreate(['id' => 'pat-ngo'], [
            'patient_code' => 'PT-2026-1122',
            'first_name' => 'Marie',
            'last_name' => 'Ngo',
            'date_of_birth' => '1995-11-22',
            'phone' => '+237699887766',
            'address' => 'Entrée Ndiki, Ville',
            'blood_group' => 'A+',
            'emergency_contact_name' => 'Albert Ngo',
            'emergency_contact_phone' => '+237677554433'
        ]);
 
        $preg2 = Pregnancy::firstOrCreate(['id' => 'preg-ngo'], [
            'patient_id' => $patient2->id,
            'gravidity' => 4,
            'parity' => 3,
            'estimated_delivery_date' => Carbon::now()->toDateString(),
            'gestational_age_weeks' => 40,
            'risk_level' => 'HIGH',
            'status' => 'ACTIVE'
        ]);
 
        $labour2 = Labour::firstOrCreate(['id' => 'labour-ngo'], [
            'pregnancy_id' => $preg2->id,
            'facility_id' => 'fac-ndiki',
            'admitted_by' => 'u-midwife',
            'admission_datetime' => Carbon::now()->subHours(6)->toDateTimeString(),
            'labour_status' => 'TRANSFERRED'
        ]);
 
        $part2 = Partogram::firstOrCreate(['id' => 'part-ngo'], [
            'labour_id' => $labour2->id,
            'started_at' => Carbon::now()->subHours(6)->toDateTimeString(),
            'status' => 'ACTIVE'
        ]);
 
        // Entries for Marie Ngo
        $entries2 = [
            [
                'id' => 'ent-ngo-1',
                'partogram_id' => $part2->id,
                'observation_time' => Carbon::now()->subHours(6)->toDateTimeString(),
                'cervical_dilation' => 4.0,
                'fetal_heart_rate' => 140,
                'contractions_per_10min' => 2,
                'contraction_duration_secs' => 15,
                'maternal_temperature' => 37.1,
                'maternal_pulse' => 78,
                'systolic_bp' => 125,
                'diastolic_bp' => 80,
                'fetal_station' => 5,
                'membrane_status' => 'INTACT',
                'amniotic_fluid_status' => 'NONE',
                'notes' => 'Admission. Col intermédiaire.'
            ],
            [
                'id' => 'ent-ngo-2',
                'partogram_id' => $part2->id,
                'observation_time' => Carbon::now()->subHours(4)->toDateTimeString(),
                'cervical_dilation' => 5.0,
                'fetal_heart_rate' => 130,
                'contractions_per_10min' => 3,
                'contraction_duration_secs' => 22,
                'maternal_temperature' => 37.8,
                'maternal_pulse' => 88,
                'systolic_bp' => 135,
                'diastolic_bp' => 85,
                'fetal_station' => 4,
                'membrane_status' => 'RUPTURED',
                'amniotic_fluid_status' => 'CLEAR',
                'notes' => 'Rupture de la poche des eaux, liquide clair.'
            ],
            [
                'id' => 'ent-ngo-3',
                'partogram_id' => $part2->id,
                'observation_time' => Carbon::now()->subHours(2)->toDateTimeString(),
                'cervical_dilation' => 5.0, // Stagnant!
                'fetal_heart_rate' => 98,  // Fetal Distress!
                'contractions_per_10min' => 3,
                'contraction_duration_secs' => 25,
                'maternal_temperature' => 38.4, // Infection!
                'maternal_pulse' => 102,
                'systolic_bp' => 145, // Hypertension!
                'diastolic_bp' => 92,
                'fetal_station' => 4,
                'membrane_status' => 'RUPTURED',
                'amniotic_fluid_status' => 'MECONIUM',
                'notes' => 'Détresse fœtale aiguë et stagnation de la dilatation. Présence de méconium épais.'
            ]
        ];
        foreach ($entries2 as $ent) {
            PartogramEntry::firstOrCreate(['id' => $ent['id']], $ent);
        }
 
        // Seed clinical alerts for Marie Ngo
        $alerts = [
            [
                'id' => 'al-ngo-fcf',
                'labour_id' => $labour2->id,
                'partogram_entry_id' => 'ent-ngo-3',
                'alert_level' => 'RED',
                'alert_type' => 'FCF',
                'alert_message' => 'Fréquence cardiaque fœtale critique (98 bpm). Risque important de souffrance fœtale aiguë.',
                'generated_at' => Carbon::now()->subHours(2)->toDateTimeString()
            ],
            [
                'id' => 'al-ngo-stag',
                'labour_id' => $labour2->id,
                'partogram_entry_id' => 'ent-ngo-3',
                'alert_level' => 'RED',
                'alert_type' => 'STAGNATION',
                'alert_message' => 'Absence totale de progression de la dilatation cervicale (5.0 cm) depuis 2h00.',
                'generated_at' => Carbon::now()->subHours(2)->toDateTimeString()
            ],
            [
                'id' => 'al-ngo-temp',
                'labour_id' => $labour2->id,
                'partogram_entry_id' => 'ent-ngo-3',
                'alert_level' => 'ORANGE',
                'alert_type' => 'TEMPERATURE',
                'alert_message' => 'Fièvre maternelle détectée (38.4 °C). Infection intra-amniotique suspectée.',
                'generated_at' => Carbon::now()->subHours(2)->toDateTimeString()
            ],
            [
                'id' => 'al-ngo-bp',
                'labour_id' => $labour2->id,
                'partogram_entry_id' => 'ent-ngo-3',
                'alert_level' => 'ORANGE',
                'alert_type' => 'BP',
                'alert_message' => 'Hypertension artérielle sévère (145/92 mmHg). Risque cardiovasculaire ou de pré-éclampsie.',
                'generated_at' => Carbon::now()->subHours(2)->toDateTimeString()
            ]
        ];
        foreach ($alerts as $al) {
            Alert::firstOrCreate(['id' => $al['id']], $al);
        }
 
        // Seed active pending referral for Marie Ngo to Bafia
        Referral::firstOrCreate(['id' => 'ref-ngo'], [
            'labour_id' => $labour2->id,
            'source_facility_id' => 'fac-ndiki',
            'destination_facility_id' => 'fac-bafia',
            'initiated_by' => 'u-midwife',
            'reason' => 'Souffrance fœtale aiguë (FCF 98 bpm) + Stagnation de la dilatation cervicale (5 cm depuis 2 heures) + Fièvre maternelle 38.4°C.',
            'referral_status' => 'PENDING'
        ]);
 
        // 7. Historical cases (completed / referred)
        $pastPatients = [
            ['id' => 'pat-past-1', 'patient_code' => 'PT-2026-0101', 'first_name' => 'Solange', 'last_name' => 'Ndong', 'date_of_birth' => '1999-01-10', 'phone' => '+237699110022', 'address' => 'Bafia', 'blood_group' => 'B+', 'emergency_contact_name' => 'Jean Ndong', 'emergency_contact_phone' => '+237688112233'],
            ['id' => 'pat-past-2', 'patient_code' => 'PT-2026-0102', 'first_name' => 'Grace', 'last_name' => 'Moukoko', 'date_of_birth' => '2001-08-04', 'phone' => '+237699330044', 'address' => 'Ndiki', 'blood_group' => 'AB+', 'emergency_contact_name' => 'Marc Moukoko', 'emergency_contact_phone' => '+237655009911'],
            ['id' => 'pat-past-3', 'patient_code' => 'PT-2026-0103', 'first_name' => 'Helene', 'last_name' => 'Ngono', 'date_of_birth' => '1993-04-12', 'phone' => '+237699440055', 'address' => 'Bafia Centre', 'blood_group' => 'A-', 'emergency_contact_name' => 'Paul Ngono', 'emergency_contact_phone' => '+237666223344']
        ];
        foreach ($pastPatients as $ppat) {
            Patient::firstOrCreate(['id' => $ppat['id']], $ppat);
        }
 
        $pastPregnancies = [
            ['id' => 'preg-past-1', 'patient_id' => 'pat-past-1', 'gravidity' => 1, 'parity' => 0, 'estimated_delivery_date' => '2026-05-10', 'gestational_age_weeks' => 39, 'risk_level' => 'LOW', 'status' => 'DELIVERED'],
            ['id' => 'preg-past-2', 'patient_id' => 'pat-past-2', 'gravidity' => 2, 'parity' => 1, 'estimated_delivery_date' => '2026-05-15', 'gestational_age_weeks' => 40, 'risk_level' => 'MEDIUM', 'status' => 'DELIVERED'],
            ['id' => 'preg-past-3', 'patient_id' => 'pat-past-3', 'gravidity' => 5, 'parity' => 4, 'estimated_delivery_date' => '2026-05-20', 'gestational_age_weeks' => 38, 'risk_level' => 'HIGH', 'status' => 'REFERRED']
        ];
        foreach ($pastPregnancies as $ppreg) {
            Pregnancy::firstOrCreate(['id' => $ppreg['id']], $ppreg);
        }
 
        $pastLabours = [
            ['id' => 'labour-past-1', 'pregnancy_id' => 'preg-past-1', 'facility_id' => 'fac-ndiki', 'admitted_by' => 'u-midwife', 'admission_datetime' => '2026-05-09T08:00:00Z', 'labour_status' => 'COMPLETED', 'delivery_type' => 'VAGINAL', 'outcome' => 'HEALTHY_MOU'],
            ['id' => 'labour-past-2', 'pregnancy_id' => 'preg-past-2', 'facility_id' => 'fac-ndiki', 'admitted_by' => 'u-midwife', 'admission_datetime' => '2026-05-14T20:00:00Z', 'labour_status' => 'COMPLETED', 'delivery_type' => 'VAGINAL', 'outcome' => 'HEALTHY_CHILD'],
            ['id' => 'labour-past-3', 'pregnancy_id' => 'preg-past-3', 'facility_id' => 'fac-ndiki', 'admitted_by' => 'u-midwife', 'admission_datetime' => '2026-05-19T10:00:00Z', 'labour_status' => 'COMPLETED', 'delivery_type' => 'CESAREAN', 'outcome' => 'COMPLICATED']
        ];
        foreach ($pastLabours as $plab) {
            Labour::firstOrCreate(['id' => $plab['id']], $plab);
        }
 
        // Seed past completed referral with LT-889-OA ambulance
        Referral::firstOrCreate(['id' => 'ref-past-3'], [
            'labour_id' => 'labour-past-3',
            'source_facility_id' => 'fac-ndiki',
            'destination_facility_id' => 'fac-bafia',
            'initiated_by' => 'u-midwife',
            'reason' => 'Hémorragie pré-partum modérée.',
            'referral_status' => 'ADMITTED',
            'departure_time' => '2026-05-19T11:15:00Z',
            'arrival_time' => '2026-05-19T11:45:00Z',
            'ambulance_id' => 'amb-1'
        ]);
    }
}
