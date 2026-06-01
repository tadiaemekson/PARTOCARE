import { db, type Patient, type Pregnancy, type Labour, type Partogram, type PartogramEntry, type Referral, type Ambulance, type Alert, type Facility } from './db';
import { evaluateClinicalRules } from './alertEngine';
import { syncManager } from './sync';

// Simulates network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // --- Connection Status ---
  isOnline(): boolean {
    return navigator.onLine;
  },

  // --- Auth API ---
  async login(email: string, password?: string): Promise<{ token: string; user: any }> {
    if (this.isOnline()) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password: password || 'password' })
        });
 
        if (response.ok) {
          const data = await response.json();
          // Store token in local storage
          localStorage.setItem('partocare_api_token', data.token);
 
          // Cache profile locally in IndexedDB so it's available for offline login
          const userObj = data.user;
          await db.roles.put({
            id: userObj.role.id,
            name: userObj.role.name,
            description: `${userObj.role.name} Account`
          });
          await db.facilities.put({
            id: userObj.facility.id,
            name: userObj.facility.name,
            type: userObj.facility.type,
            region: 'Centre',
            district: 'Bafia',
            address: '',
            phone: '',
            latitude: 0,
            longitude: 0
          });
          await db.users.put({
            id: userObj.id,
            role_id: userObj.role.id,
            facility_id: userObj.facility.id,
            first_name: userObj.first_name,
            last_name: userObj.last_name,
            email: userObj.email,
            phone: '',
            status: 1
          });
 
          return data;
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Identifiants incorrects ou compte inexistant.");
        }
      } catch (err: any) {
        console.warn("Online login failed, falling back to local database:", err);
        if (err.message && err.message.includes("Identifiants incorrects")) {
          throw err;
        }
      }
    }
 
    // Fallback/offline auth
    const user = await db.users.where('email').equalsIgnoreCase(email).first();
    if (!user) {
      throw new Error("Identifiants incorrects ou compte inexistant.");
    }
    
    const role = await db.roles.get(user.role_id);
    const facility = await db.facilities.get(user.facility_id);

    return {
      token: `mock-jwt-token-for-${user.id}`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: {
          id: user.role_id,
          name: role?.name || 'MIDWIFE'
        },
        facility: {
          id: user.facility_id,
          name: facility?.name || 'CMA de Ndiki',
          type: facility?.type || 'CMA'
        }
      }
    };
  },

  // --- Dashboard Stats API ---
  async getDashboardStats(_facilityId: string): Promise<any> {
    if (this.isOnline()) {
      try {
        const token = localStorage.getItem('partocare_api_token');
        if (token) {
          const response = await fetch('http://127.0.0.1:8000/api/v1/dashboard/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            return data;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dashboard stats online, falling back to local:", err);
      }
    }
 
    // Fallback/offline implementation
    await delay(300);
    const activeLabours = await db.labours
      .where('labour_status')
      .equals('ACTIVE')
      .toArray();

    // Map active labors with patient names, latest dilation and alert levels
    const mappedActiveLabours = await Promise.all(
      activeLabours.map(async (labour) => {
        const pregnancy = await db.pregnancies.get(labour.pregnancy_id);
        const patient = pregnancy ? await db.patients.get(pregnancy.patient_id) : null;
        const partogram = await db.partograms.where('labour_id').equals(labour.id).first();
        
        let latestDilation = 4;
        let lastEntryTime = labour.admission_datetime;
        
        if (partogram) {
          const entries = await db.partogram_entries
            .where('partogram_id')
            .equals(partogram.id)
            .sortBy('observation_time');
            
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            latestDilation = lastEntry.cervical_dilation;
            lastEntryTime = lastEntry.observation_time;
          }
        }

        // Find highest alert level
        const alerts = await db.alerts
          .where('labour_id')
          .equals(labour.id)
          .and(a => !a.resolved_at)
          .toArray();

        let alertLevel = 'GREEN';
        if (alerts.some(a => a.alert_level === 'RED')) alertLevel = 'RED';
        else if (alerts.some(a => a.alert_level === 'ORANGE')) alertLevel = 'ORANGE';
        else if (alerts.some(a => a.alert_level === 'YELLOW')) alertLevel = 'YELLOW';

        return {
          labour_id: labour.id,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente Inconnue',
          patient_code: patient?.patient_code || '',
          admission_datetime: labour.admission_datetime,
          latest_dilation: latestDilation,
          alert_level: alertLevel,
          last_entry_at: lastEntryTime
        };
      })
    );

    const pendingReferrals = await db.referrals
      .where('referral_status')
      .equals('PENDING')
      .toArray();

    const criticalCasesCount = mappedActiveLabours.filter(l => l.alert_level === 'RED' || l.alert_level === 'ORANGE').length;
    
    // Count deliveries today (mock + completed today)
    const completedLabours = await db.labours
      .where('labour_status')
      .equals('COMPLETED')
      .toArray();
    
    const deliveriesTodayCount = completedLabours.length + 3; // Seed count for visual realism

    return {
      summary: {
        active_labours_count: mappedActiveLabours.length,
        critical_cases_count: criticalCasesCount,
        pending_referrals_count: pendingReferrals.length,
        deliveries_today_count: deliveriesTodayCount
      },
      active_labours: mappedActiveLabours
    };
  },

  // --- Patients API ---
  async getPatients(): Promise<Patient[]> {
    await delay(300);
    return await db.patients.toArray();
  },

  async createPatient(patientData: Omit<Patient, 'id' | 'patient_code'>): Promise<Patient> {
    await delay(400);
    const id = 'pat-' + Math.random().toString(36).substr(2, 9);
    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const patient_code = `PT-2026-${codeNumber}`;
    
    const newPatient: Patient = {
      ...patientData,
      id,
      patient_code,
      created_at: new Date().toISOString()
    };

    await db.patients.add(newPatient);

    // Queue for syncing offline outbox
    await db.sync_queue.add({
      action: 'CREATE_PATIENT',
      payload: newPatient,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return newPatient;
  },

  async getPatientWithPregnancies(patientId: string): Promise<{ patient: Patient; pregnancies: Pregnancy[] }> {
    await delay(200);
    const patient = await db.patients.get(patientId);
    if (!patient) throw new Error("Patiente non trouvée");
    const pregnancies = await db.pregnancies.where('patient_id').equals(patientId).toArray();
    return { patient, pregnancies };
  },

  async createPregnancy(patientId: string, pregnancyData: Omit<Pregnancy, 'id' | 'patient_id' | 'status'>): Promise<Pregnancy> {
    await delay(300);
    const id = 'preg-' + Math.random().toString(36).substr(2, 9);
    
    const newPregnancy: Pregnancy = {
      ...pregnancyData,
      id,
      patient_id: patientId,
      status: 'ACTIVE'
    };

    await db.pregnancies.add(newPregnancy);

    await db.sync_queue.add({
      action: 'CREATE_PREGNANCY',
      payload: newPregnancy,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return newPregnancy;
  },

  // --- Labours / Partograms API ---
  async startLabour(pregnancyId: string, facilityId: string, admittedBy: string): Promise<Labour> {
    await delay(400);
    const labour_id = 'labour-' + Math.random().toString(36).substr(2, 9);
    const partogram_id = 'part-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const newLabour: Labour = {
      id: labour_id,
      pregnancy_id: pregnancyId,
      facility_id: facilityId,
      admitted_by: admittedBy,
      admission_datetime: now,
      labour_status: 'ACTIVE'
    };

    const newPartogram: Partogram = {
      id: partogram_id,
      labour_id,
      started_at: now,
      status: 'ACTIVE'
    };

    await db.transaction('rw', [db.labours, db.partograms, db.sync_queue], async () => {
      await db.labours.add(newLabour);
      await db.partograms.add(newPartogram);
      await db.sync_queue.add({
        action: 'START_LABOUR',
        payload: { labour: newLabour, partogram: newPartogram },
        status: 'PENDING',
        created_at: now
      });
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return newLabour;
  },

  async getActiveLabourDetails(labourId: string): Promise<any> {
    await delay(300);
    const labour = await db.labours.get(labourId);
    if (!labour) throw new Error("Session de travail non trouvée");
    
    const pregnancy = await db.pregnancies.get(labour.pregnancy_id);
    const patient = pregnancy ? await db.patients.get(pregnancy.patient_id) : null;
    const partogram = await db.partograms.where('labour_id').equals(labourId).first();
    
    let entries: PartogramEntry[] = [];
    let alerts: Alert[] = [];
    
    if (partogram) {
      entries = await db.partogram_entries
        .where('partogram_id')
        .equals(partogram.id)
        .sortBy('observation_time');

      alerts = await db.alerts
        .where('labour_id')
        .equals(labourId)
        .toArray();
    }

    return {
      labour,
      pregnancy,
      patient,
      partogram,
      entries,
      alerts
    };
  },

  async addPartogramEntry(partogramId: string, entryData: Omit<PartogramEntry, 'id' | 'partogram_id'>): Promise<any> {
    await delay(400);
    const entry_id = 'ent-' + Math.random().toString(36).substr(2, 9);
    const partogram = await db.partograms.get(partogramId);
    if (!partogram) throw new Error("Partogramme introuvable");

    const newEntry: PartogramEntry = {
      ...entryData,
      id: entry_id,
      partogram_id: partogramId
    };

    // Retrieve previous entries to feed the Alert Engine
    const previousEntries = await db.partogram_entries
      .where('partogram_id')
      .equals(partogramId)
      .sortBy('observation_time');

    // Run clinical alert rules client-side
    const evaluation = evaluateClinicalRules(newEntry, previousEntries);
    const now = new Date().toISOString();

    const createdAlerts: Alert[] = [];

    await db.transaction('rw', [db.partogram_entries, db.alerts, db.sync_queue], async () => {
      await db.partogram_entries.add(newEntry);
      
      // Save new alerts to local IndexedDB
      for (const alertData of evaluation.alerts) {
        const alert_id = 'al-' + Math.random().toString(36).substr(2, 9);
        const alert: Alert = {
          ...alertData,
          id: alert_id,
          labour_id: partogram.labour_id,
          partogram_entry_id: entry_id,
          generated_at: now,
          resolved_at: null
        };
        await db.alerts.add(alert);
        createdAlerts.push(alert);
      }

      // Add to sync outbox queue
      await db.sync_queue.add({
        action: 'ADD_ENTRY',
        payload: { entry: newEntry, alerts: createdAlerts },
        status: 'PENDING',
        created_at: now
      });
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return {
      entry: newEntry,
      triggered_alerts: createdAlerts,
      alert_level: evaluation.highestLevel
    };
  },

  // --- Referral API ---
  async getReferrals(): Promise<any[]> {
    await delay(300);
    const referrals = await db.referrals.toArray();
    
    return await Promise.all(
      referrals.map(async (ref) => {
        const labour = await db.labours.get(ref.labour_id);
        const pregnancy = labour ? await db.pregnancies.get(labour.pregnancy_id) : null;
        const patient = pregnancy ? await db.patients.get(pregnancy.patient_id) : null;
        const source = await db.facilities.get(ref.source_facility_id);
        const dest = await db.facilities.get(ref.destination_facility_id);
        const ambulance = ref.ambulance_id ? await db.ambulances.get(ref.ambulance_id) : null;

        return {
          ...ref,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente Inconnue',
          patient_code: patient?.patient_code || '',
          source_facility_name: source?.name || 'Inconnu',
          destination_facility_name: dest?.name || 'Inconnu',
          assigned_ambulance: ambulance ? {
            id: ambulance.id,
            registration_number: ambulance.registration_number,
            driver_name: ambulance.driver_name,
            driver_phone: ambulance.driver_phone
          } : null
        };
      })
    );
  },

  async initiateReferral(referralData: Omit<Referral, 'id' | 'referral_status'>): Promise<Referral> {
    await delay(500);
    const id = 'ref-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const newReferral: Referral = {
      ...referralData,
      id,
      referral_status: 'PENDING'
    };

    await db.transaction('rw', [db.referrals, db.labours, db.sync_queue], async () => {
      await db.referrals.add(newReferral);
      
      // Update local labor status to transferred
      await db.labours.update(referralData.labour_id, { labour_status: 'TRANSFERRED' });

      await db.sync_queue.add({
        action: 'CREATE_REFERRAL',
        payload: newReferral,
        status: 'PENDING',
        created_at: now
      });
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return newReferral;
  },

  async assignAmbulance(referralId: string, ambulanceId: string): Promise<any> {
    await delay(400);
    const now = new Date().toISOString();
    const referral = await db.referrals.get(referralId);
    if (!referral) throw new Error("Demande de référence introuvable");

    await db.transaction('rw', [db.referrals, db.ambulances, db.sync_queue], async () => {
      await db.referrals.update(referralId, {
        referral_status: 'IN_TRANSIT',
        departure_time: now,
        ambulance_id: ambulanceId
      });

      await db.ambulances.update(ambulanceId, {
        status: 'en mission'
      });

      await db.sync_queue.add({
        action: 'ASSIGN_AMBULANCE',
        payload: { referralId, ambulanceId, departure_time: now },
        status: 'PENDING',
        created_at: now
      });
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    const updatedReferral = await db.referrals.get(referralId);
    const ambulance = await db.ambulances.get(ambulanceId);

    return {
      referral_id: referralId,
      referral_status: updatedReferral?.referral_status,
      assigned_ambulance: ambulance
    };
  },

  async updateReferralStatus(referralId: string, status: Referral['referral_status']): Promise<Referral> {
    await delay(300);
    const ref = await db.referrals.get(referralId);
    if (!ref) throw new Error("Référence introuvable");

    const now = new Date().toISOString();
    
    await db.transaction('rw', [db.referrals, db.labours, db.ambulances, db.sync_queue], async () => {
      const updates: Partial<Referral> = { referral_status: status };
      
      if (status === 'ADMITTED') {
        updates.arrival_time = now;
        
        // Complete the labor locally as well
        await db.labours.update(ref.labour_id, {
          labour_status: 'COMPLETED',
          outcome: 'HEALTHY_MOU'
        });
        
        if (ref.ambulance_id) {
          await db.ambulances.update(ref.ambulance_id, { status: 'available' });
        }
      } else if (status === 'DECLINED') {
        // Reset labor back to active
        await db.labours.update(ref.labour_id, {
          labour_status: 'ACTIVE'
        });
      }

      await db.referrals.update(referralId, updates);
      
      await db.sync_queue.add({
        action: 'UPDATE_REFERRAL_STATUS',
        payload: { referralId, status, arrival_time: status === 'ADMITTED' ? now : undefined },
        status: 'PENDING',
        created_at: now
      });
    });

    if (this.isOnline()) {
      syncManager.syncOutbox().catch(err => console.error("Immediate sync failed:", err));
    }

    return (await db.referrals.get(referralId))!;
  },

  // --- Ambulances API ---
  async getAmbulances(): Promise<Ambulance[]> {
    await delay(200);
    return await db.ambulances.toArray();
  },

  async getFacilities(): Promise<Facility[]> {
    await delay(200);
    return await db.facilities.toArray();
  }
};
