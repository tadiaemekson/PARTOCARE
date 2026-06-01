import Dexie, { type Table } from 'dexie';

// --- Interface Definitions ---

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string; // CMA, District Hospital, Regional Hospital
  region: string;
  district: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  role_id: string;
  facility_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: number;
}

export interface Patient {
  id: string;
  patient_code: string; // PT-2026-XXXX
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at?: string;
}

export interface Pregnancy {
  id: string;
  patient_id: string;
  gravidity: number;
  parity: number;
  estimated_delivery_date: string;
  gestational_age_weeks: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'DELIVERED' | 'REFERRED';
}

export interface Labour {
  id: string;
  pregnancy_id: string;
  facility_id: string;
  admitted_by: string; // user_id
  admission_datetime: string;
  labour_status: 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED';
  delivery_type?: 'VAGINAL' | 'CESAREAN' | 'FORCEPS' | 'NONE';
  outcome?: 'HEALTHY_MOU' | 'HEALTHY_CHILD' | 'COMPLICATED' | 'STILLBORN' | 'NONE';
}

export interface Partogram {
  id: string;
  labour_id: string;
  started_at: string;
  completed_at?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

export interface PartogramEntry {
  id: string;
  partogram_id: string;
  observation_time: string;
  cervical_dilation: number; // 4 to 10 cm
  fetal_heart_rate: number; // bpm
  contractions_per_10min: number; // 1 to 5
  contraction_duration_secs: number; // <20s, 20-40s, >40s
  maternal_temperature: number; // °C
  maternal_pulse: number; // bpm
  systolic_bp: number; // mmHg
  diastolic_bp: number; // mmHg
  fetal_station: number; // 0 to 5 (mapped from 5/5 to 0/5 presentation)
  membrane_status: 'INTACT' | 'RUPTURED';
  amniotic_fluid_status: 'CLEAR' | 'MECONIUM' | 'BLOOD' | 'NONE';
  notes: string;
}

export interface Alert {
  id: string;
  labour_id: string;
  partogram_entry_id?: string;
  alert_level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  alert_type: 'FCF' | 'TEMPERATURE' | 'BP' | 'STAGNATION' | 'SLOW_PROGRESS';
  alert_message: string;
  generated_at: string;
  resolved_at?: string | null;
}

export interface Referral {
  id: string;
  labour_id: string;
  source_facility_id: string;
  destination_facility_id: string;
  initiated_by: string; // user_id
  reason: string;
  referral_status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'ADMITTED' | 'DECLINED';
  departure_time?: string;
  arrival_time?: string;
  ambulance_id?: string;
}

export interface Ambulance {
  id: string;
  facility_id: string; // station facility
  registration_number: string;
  driver_name: string;
  driver_phone: string;
  status: 'available' | 'en mission' | 'maintenance';
}

export interface Notification {
  id: string;
  user_id: string;
  channel: 'SMS' | 'WHATSAPP' | 'IN_APP';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sent_at: string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE_PATIENT' | 'CREATE_PREGNANCY' | 'START_LABOUR' | 'ADD_ENTRY' | 'CREATE_REFERRAL' | 'ASSIGN_AMBULANCE' | 'RESOLVE_ALERT';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  created_at: string;
}

// --- Dexie Database Class ---

class PartoCareDatabase extends Dexie {
  roles!: Table<Role, string>;
  facilities!: Table<Facility, string>;
  users!: Table<User, string>;
  patients!: Table<Patient, string>;
  pregnancies!: Table<Pregnancy, string>;
  labours!: Table<Labour, string>;
  partograms!: Table<Partogram, string>;
  partogram_entries!: Table<PartogramEntry, string>;
  alerts!: Table<Alert, string>;
  referrals!: Table<Referral, string>;
  ambulances!: Table<Ambulance, string>;
  notifications!: Table<Notification, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super('PartoCareDB');
    this.version(1).stores({
      roles: 'id, name',
      facilities: 'id, name, type',
      users: 'id, email, role_id, facility_id',
      patients: 'id, patient_code, first_name, last_name',
      pregnancies: 'id, patient_id, status',
      labours: 'id, pregnancy_id, labour_status',
      partograms: 'id, labour_id, status',
      partogram_entries: 'id, partogram_id, observation_time',
      alerts: 'id, labour_id, alert_level, alert_type',
      referrals: 'id, labour_id, referral_status, source_facility_id, destination_facility_id',
      ambulances: 'id, facility_id, status',
      notifications: 'id, user_id, status',
      sync_queue: '++id, action, status'
    });
  }
}

export const db = new PartoCareDatabase();

// --- Database Seeder ---

export async function seedDatabase() {
  const roleCount = await db.roles.count();
  if (roleCount > 0) return; // DB already seeded

  console.log('Seeding offline database with initial configuration & demo clinical data...');

  // 1. Roles
  const roles: Role[] = [
    { id: 'r-midwife', name: 'MIDWIFE', description: 'Sage-femme : Saisie partogramme, alertes, transferts' },
    { id: 'r-nurse', name: 'NURSE', description: 'Infirmier : Aide et saisie de constantes sous supervision' },
    { id: 'r-physician', name: 'PHYSICIAN', description: 'Médecin : Validation clinique, prescriptions, référence' },
    { id: 'r-gynecologist', name: 'GYNECOLOGIST', description: 'Gynécologue : Gestion des urgences obstétricales' },
    { id: 'r-manager', name: 'MATERNITY_MANAGER', description: 'Responsable Maternité : Planification et KPIs' },
    { id: 'r-admin', name: 'SYSTEM_ADMIN', description: 'Administrateur : Configuration globale et sécurité' },
    { id: 'r-district', name: 'DISTRICT_ADMIN', description: 'District Sanitaire : Rapports agrégés du district' }
  ];
  await db.roles.bulkAdd(roles);

  // 2. Facilities
  const facilities: Facility[] = [
    {
      id: 'fac-ndiki',
      name: 'CMA de Ndiki',
      type: 'CMA',
      region: 'Centre',
      district: 'Bafia',
      address: 'Ndiki Ville, Cameroun',
      phone: '+237622114455',
      latitude: 4.6738,
      longitude: 11.2334
    },
    {
      id: 'fac-bafia',
      name: 'Hôpital de District de Bafia',
      type: 'District Hospital',
      region: 'Centre',
      district: 'Bafia',
      address: 'Quartier Administratif, Bafia',
      phone: '+237622116677',
      latitude: 4.7500,
      longitude: 11.2333
    },
    {
      id: 'fac-yaounde',
      name: 'Hôpital Central de Yaoundé',
      type: 'Regional Hospital',
      region: 'Centre',
      district: 'Mfoundi',
      address: 'Ntoungou, Yaoundé',
      phone: '+237222234020',
      latitude: 3.8667,
      longitude: 11.5167
    }
  ];
  await db.facilities.bulkAdd(facilities);

  // 3. Users
  const users: User[] = [
    { id: 'u-midwife', role_id: 'r-midwife', facility_id: 'fac-ndiki', first_name: 'Marie', last_name: 'Ngo Ndiki', phone: '+237677112233', email: 'sagefemme@partocare.cm', status: 1 },
    { id: 'u-nurse', role_id: 'r-nurse', facility_id: 'fac-ndiki', first_name: 'Jean', last_name: 'Ebolowa', phone: '+237699334455', email: 'infirmier@partocare.cm', status: 1 },
    { id: 'u-physician', role_id: 'r-physician', facility_id: 'fac-ndiki', first_name: 'Pierre', last_name: 'Atangana', phone: '+237678123456', email: 'medecin@partocare.cm', status: 1 },
    { id: 'u-gynecologist', role_id: 'r-gynecologist', facility_id: 'fac-bafia', first_name: 'Luc', last_name: 'Mebara', phone: '+237699223344', email: 'gynecologue@partocare.cm', status: 1 },
    { id: 'u-manager', role_id: 'r-manager', facility_id: 'fac-ndiki', first_name: 'Chantal', last_name: 'Bella', phone: '+237655889900', email: 'responsable@partocare.cm', status: 1 },
    { id: 'u-admin', role_id: 'r-admin', facility_id: 'fac-yaounde', first_name: 'Paul', last_name: 'Biya Jr', phone: '+237699999999', email: 'admin@partocare.cm', status: 1 },
    { id: 'u-district', role_id: 'r-district', facility_id: 'fac-bafia', first_name: 'Gaston', last_name: 'Eloundou', phone: '+237677777777', email: 'district@partocare.cm', status: 1 }
  ];
  await db.users.bulkAdd(users);

  // 4. Ambulances
  const ambulances: Ambulance[] = [
    { id: 'amb-1', facility_id: 'fac-bafia', registration_number: 'LT-889-OA', driver_name: 'Samuel Eto\'o', driver_phone: '+237699999999', status: 'available' },
    { id: 'amb-2', facility_id: 'fac-ndiki', registration_number: 'CE-452-BB', driver_name: 'Marc-Vivien Foé', driver_phone: '+237677777777', status: 'en mission' },
    { id: 'amb-3', facility_id: 'fac-yaounde', registration_number: 'OU-112-AA', driver_name: 'Rigobert Song', driver_phone: '+237688888888', status: 'maintenance' }
  ];
  await db.ambulances.bulkAdd(ambulances);

  // 5. Patients & Pregnancy 1: Normal Labor (Florence Ebanda)
  const patient1: Patient = {
    id: 'pat-ebanda',
    patient_code: 'PT-2026-9876',
    first_name: 'Florence',
    last_name: 'Ebanda',
    date_of_birth: '1998-05-15',
    phone: '+237677123456',
    address: 'Quartier 2, Ndiki',
    blood_group: 'O+',
    emergency_contact_name: 'Jean Ebanda',
    emergency_contact_phone: '+237699876543',
    created_at: '2026-05-31T20:00:00Z'
  };
  const preg1: Pregnancy = {
    id: 'preg-ebanda',
    patient_id: 'pat-ebanda',
    gravidity: 3,
    parity: 2,
    estimated_delivery_date: '2026-06-02',
    gestational_age_weeks: 39,
    risk_level: 'LOW',
    status: 'ACTIVE'
  };
  const labour1: Labour = {
    id: 'labour-ebanda',
    pregnancy_id: 'preg-ebanda',
    facility_id: 'fac-ndiki',
    admitted_by: 'u-midwife',
    admission_datetime: '2026-06-01T00:30:00Z',
    labour_status: 'ACTIVE'
  };
  const part1: Partogram = {
    id: 'part-ebanda',
    labour_id: 'labour-ebanda',
    started_at: '2026-06-01T00:30:00Z',
    status: 'ACTIVE'
  };

  await db.patients.add(patient1);
  await db.pregnancies.add(preg1);
  await db.labours.add(labour1);
  await db.partograms.add(part1);

  // Seed entries for Patient 1: Florence Ebanda (normal progression)
  // Let's seed entries at T=0, T=2, and T=4 hours
  const entries1: PartogramEntry[] = [
    {
      id: 'ent-eb-1',
      partogram_id: 'part-ebanda',
      observation_time: '2026-06-01T00:30:00Z', // T=0
      cervical_dilation: 4.0,
      fetal_heart_rate: 136,
      contractions_per_10min: 2,
      contraction_duration_secs: 18, // <20s (points)
      maternal_temperature: 36.8,
      maternal_pulse: 76,
      systolic_bp: 115,
      diastolic_bp: 75,
      fetal_station: 4, // 4/5
      membrane_status: 'INTACT',
      amniotic_fluid_status: 'NONE',
      notes: 'Admission en phase active. Patiente calme.'
    },
    {
      id: 'ent-eb-2',
      partogram_id: 'part-ebanda',
      observation_time: '2026-06-01T02:30:00Z', // T=2
      cervical_dilation: 6.0,
      fetal_heart_rate: 140,
      contractions_per_10min: 3,
      contraction_duration_secs: 32, // 20-40s (hachures)
      maternal_temperature: 37.0,
      maternal_pulse: 80,
      systolic_bp: 120,
      diastolic_bp: 80,
      fetal_station: 3, // 3/5
      membrane_status: 'INTACT',
      amniotic_fluid_status: 'NONE',
      notes: 'Progression normale de la dilatation. Contractions régulières.'
    },
    {
      id: 'ent-eb-3',
      partogram_id: 'part-ebanda',
      observation_time: '2026-06-01T04:30:00Z', // T=4
      cervical_dilation: 8.5,
      fetal_heart_rate: 138,
      contractions_per_10min: 4,
      contraction_duration_secs: 45, // >40s (noir complet)
      maternal_temperature: 36.9,
      maternal_pulse: 82,
      systolic_bp: 120,
      diastolic_bp: 80,
      fetal_station: 1, // 1/5 (descente rapide)
      membrane_status: 'RUPTURED',
      amniotic_fluid_status: 'CLEAR',
      notes: 'Poche des eaux rompue spontanément. Liquide clair.'
    }
  ];
  await db.partogram_entries.bulkAdd(entries1);

  // 6. Patients & Pregnancy 2: High Risk Labor (Marie Ngo)
  const patient2: Patient = {
    id: 'pat-ngo',
    patient_code: 'PT-2026-1122',
    first_name: 'Marie',
    last_name: 'Ngo',
    date_of_birth: '1995-11-22',
    phone: '+237699887766',
    address: 'Entrée Ndiki, Ville',
    blood_group: 'A+',
    emergency_contact_name: 'Albert Ngo',
    emergency_contact_phone: '+237677554433',
    created_at: '2026-05-31T21:30:00Z'
  };
  const preg2: Pregnancy = {
    id: 'preg-ngo',
    patient_id: 'pat-ngo',
    gravidity: 4,
    parity: 3,
    estimated_delivery_date: '2026-06-01',
    gestational_age_weeks: 40,
    risk_level: 'HIGH',
    status: 'ACTIVE'
  };
  const labour2: Labour = {
    id: 'labour-ngo',
    pregnancy_id: 'preg-ngo',
    facility_id: 'fac-ndiki',
    admitted_by: 'u-midwife',
    admission_datetime: '2026-05-31T23:30:00Z',
    labour_status: 'ACTIVE'
  };
  const part2: Partogram = {
    id: 'part-ngo',
    labour_id: 'labour-ngo',
    started_at: '2026-05-31T23:30:00Z',
    status: 'ACTIVE'
  };

  await db.patients.add(patient2);
  await db.pregnancies.add(preg2);
  await db.labours.add(labour2);
  await db.partograms.add(part2);

  // Seed entries for Patient 2: Marie Ngo (stagnation & fetal distress alerts)
  // Let's seed entries at T=0, T=2, and T=4 (with critical parameters)
  const entries2: PartogramEntry[] = [
    {
      id: 'ent-ngo-1',
      partogram_id: 'part-ngo',
      observation_time: '2026-05-31T23:30:00Z', // T=0
      cervical_dilation: 4.0,
      fetal_heart_rate: 140,
      contractions_per_10min: 2,
      contraction_duration_secs: 15,
      maternal_temperature: 37.1,
      maternal_pulse: 78,
      systolic_bp: 125,
      diastolic_bp: 80,
      fetal_station: 5, // 5/5
      membrane_status: 'INTACT',
      amniotic_fluid_status: 'NONE',
      notes: 'Admission. Col intermédiaire.'
    },
    {
      id: 'ent-ngo-2',
      partogram_id: 'part-ngo',
      observation_time: '2026-06-01T01:30:00Z', // T=2
      cervical_dilation: 5.0,
      fetal_heart_rate: 130,
      contractions_per_10min: 3,
      contraction_duration_secs: 22,
      maternal_temperature: 37.8, // Slight increase
      maternal_pulse: 88,
      systolic_bp: 135,
      diastolic_bp: 85,
      fetal_station: 4, // 4/5
      membrane_status: 'RUPTURED',
      amniotic_fluid_status: 'CLEAR',
      notes: 'Rupture de la poche des eaux, liquide clair.'
    },
    {
      id: 'ent-ngo-3',
      partogram_id: 'part-ngo',
      observation_time: '2026-06-01T03:30:00Z', // T=4
      cervical_dilation: 5.0, // Stagnation over 2 hours! (Dilation Red Alert)
      fetal_heart_rate: 98,  // FHR < 110 (Fetal Distress Red Alert!)
      contractions_per_10min: 3,
      contraction_duration_secs: 25,
      maternal_temperature: 38.4, // Temp > 38.0 (Infection Orange Alert!)
      maternal_pulse: 102, // High pulse
      systolic_bp: 145, // BP >= 140 (Hypertension Orange Alert!)
      diastolic_bp: 92, // BP >= 90
      fetal_station: 4, // Presentation stagnant
      membrane_status: 'RUPTURED',
      amniotic_fluid_status: 'MECONIUM', // Meconium fluid (Risk)
      notes: 'Détresse fœtale aiguë et stagnation de la dilatation. Présence de méconium épais.'
    }
  ];
  await db.partogram_entries.bulkAdd(entries2);

  // Add clinical alerts for Marie Ngo
  const alerts2: Alert[] = [
    {
      id: 'al-ngo-fcf',
      labour_id: 'labour-ngo',
      partogram_entry_id: 'ent-ngo-3',
      alert_level: 'RED',
      alert_type: 'FCF',
      alert_message: 'Fréquence cardiaque fœtale critique (98 bpm). Risque important de souffrance fœtale aiguë.',
      generated_at: '2026-06-01T03:30:00Z',
      resolved_at: null
    },
    {
      id: 'al-ngo-stag',
      labour_id: 'labour-ngo',
      partogram_entry_id: 'ent-ngo-3',
      alert_level: 'RED',
      alert_type: 'STAGNATION',
      alert_message: 'Absence totale de progression de la dilatation cervicale (5.0 cm) depuis 2h00.',
      generated_at: '2026-06-01T03:30:00Z',
      resolved_at: null
    },
    {
      id: 'al-ngo-temp',
      labour_id: 'labour-ngo',
      partogram_entry_id: 'ent-ngo-3',
      alert_level: 'ORANGE',
      alert_type: 'TEMPERATURE',
      alert_message: 'Fièvre maternelle détectée (38.4 °C). Infection intra-amniotique suspectée.',
      generated_at: '2026-06-01T03:30:00Z',
      resolved_at: null
    },
    {
      id: 'al-ngo-bp',
      labour_id: 'labour-ngo',
      partogram_entry_id: 'ent-ngo-3',
      alert_level: 'ORANGE',
      alert_type: 'BP',
      alert_message: 'Hypertension artérielle sévère (145/92 mmHg). Risque cardiovasculaire ou de pré-éclampsie.',
      generated_at: '2026-06-01T03:30:00Z',
      resolved_at: null
    }
  ];
  await db.alerts.bulkAdd(alerts2);

  // Create a pending referral for Marie Ngo to Hôpital de District de Bafia
  const ref2: Referral = {
    id: 'ref-ngo',
    labour_id: 'labour-ngo',
    source_facility_id: 'fac-ndiki',
    destination_facility_id: 'fac-bafia',
    initiated_by: 'u-midwife',
    reason: 'Souffrance fœtale aiguë (FCF 98 bpm) + Stagnation de la dilatation cervicale (5 cm depuis 2 heures) + Fièvre maternelle 38.4°C.',
    referral_status: 'PENDING',
  };
  await db.referrals.add(ref2);

  // Add historical data: Completed Labours (for reporting and charts)
  // Let's add 5 completed labours
  const pastPatients: Patient[] = [
    { id: 'pat-past-1', patient_code: 'PT-2026-0101', first_name: 'Solange', last_name: 'Ndong', date_of_birth: '1999-01-10', phone: '+237699110022', address: 'Bafia', blood_group: 'B+', emergency_contact_name: 'Jean Ndong', emergency_contact_phone: '+237688112233' },
    { id: 'pat-past-2', patient_code: 'PT-2026-0102', first_name: 'Grace', last_name: 'Moukoko', date_of_birth: '2001-08-04', phone: '+237699330044', address: 'Ndiki', blood_group: 'AB+', emergency_contact_name: 'Marc Moukoko', emergency_contact_phone: '+237655009911' },
    { id: 'pat-past-3', patient_code: 'PT-2026-0103', first_name: 'Helene', last_name: 'Ngono', date_of_birth: '1993-04-12', phone: '+237699440055', address: 'Bafia Centre', blood_group: 'A-', emergency_contact_name: 'Paul Ngono', emergency_contact_phone: '+237666223344' }
  ];
  await db.patients.bulkAdd(pastPatients);

  const pastPregnancies: Pregnancy[] = [
    { id: 'preg-past-1', patient_id: 'pat-past-1', gravidity: 1, parity: 0, estimated_delivery_date: '2026-05-10', gestational_age_weeks: 39, risk_level: 'LOW', status: 'DELIVERED' },
    { id: 'preg-past-2', patient_id: 'pat-past-2', gravidity: 2, parity: 1, estimated_delivery_date: '2026-05-15', gestational_age_weeks: 40, risk_level: 'MEDIUM', status: 'DELIVERED' },
    { id: 'preg-past-3', patient_id: 'pat-past-3', gravidity: 5, parity: 4, estimated_delivery_date: '2026-05-20', gestational_age_weeks: 38, risk_level: 'HIGH', status: 'REFERRED' }
  ];
  await db.pregnancies.bulkAdd(pastPregnancies);

  const pastLabours: Labour[] = [
    { id: 'labour-past-1', pregnancy_id: 'preg-past-1', facility_id: 'fac-ndiki', admitted_by: 'u-midwife', admission_datetime: '2026-05-09T08:00:00Z', labour_status: 'COMPLETED', delivery_type: 'VAGINAL', outcome: 'HEALTHY_MOU' },
    { id: 'labour-past-2', pregnancy_id: 'preg-past-2', facility_id: 'fac-ndiki', admitted_by: 'u-midwife', admission_datetime: '2026-05-14T20:00:00Z', labour_status: 'COMPLETED', delivery_type: 'VAGINAL', outcome: 'HEALTHY_CHILD' },
    { id: 'labour-past-3', pregnancy_id: 'preg-past-3', facility_id: 'fac-ndiki', admitted_by: 'u-midwife', admission_datetime: '2026-05-19T10:00:00Z', labour_status: 'TRANSFERRED', delivery_type: 'CESAREAN', outcome: 'COMPLICATED' }
  ];
  await db.labours.bulkAdd(pastLabours);

  const pastReferrals: Referral[] = [
    {
      id: 'ref-past-3',
      labour_id: 'labour-past-3',
      source_facility_id: 'fac-ndiki',
      destination_facility_id: 'fac-bafia',
      initiated_by: 'u-midwife',
      reason: 'Hémorragie pré-partum modérée.',
      referral_status: 'ADMITTED',
      departure_time: '2026-05-19T11:15:00Z',
      arrival_time: '2026-05-19T11:45:00Z',
      ambulance_id: 'amb-1'
    }
  ];
  await db.referrals.bulkAdd(pastReferrals);

  console.log('IndexedDB seeded successfully.');
}
