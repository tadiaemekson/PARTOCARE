import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PartogramChart } from '../components/PartogramChart';
import { ObservationForm } from '../components/ObservationForm';
import { 
  ArrowLeft, Clock, Activity, Send, 
  CheckCircle, Plus, AlertTriangle, X, Truck, Download
} from 'lucide-react';

export const PartogramPage: React.FC = () => {
  const { labourId } = useParams<{ labourId: string }>();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  // Dialog states
  const [showObsDrawer, setShowObsDrawer] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Referral form states
  const [destFacilityId, setDestFacilityId] = useState('');
  const [referralReason, setReferralReason] = useState('');

  // Outcome form states
  const [deliveryType, setDeliveryType] = useState<'VAGINAL' | 'CESAREAN' | 'FORCEPS'>('VAGINAL');
  const [deliveryOutcome, setDeliveryOutcome] = useState<'HEALTHY_MOU' | 'HEALTHY_CHILD' | 'COMPLICATED' | 'STILLBORN'>('HEALTHY_MOU');

  // Reactive DB queries using useLiveQuery
  const data = useLiveQuery(async () => {
    if (!labourId) return null;
    
    const labour = await db.labours.get(labourId);
    if (!labour) return null;

    const pregnancy = await db.pregnancies.get(labour.pregnancy_id);
    const patient = pregnancy ? await db.patients.get(pregnancy.patient_id) : null;
    const partogram = await db.partograms.where('labour_id').equals(labourId).first();
    
    let entries: any[] = [];
    let alerts: any[] = [];
    let activeReferral: any = null;

    if (partogram) {
      entries = await db.partogram_entries
        .where('partogram_id')
        .equals(partogram.id)
        .sortBy('observation_time');

      alerts = await db.alerts
        .where('labour_id')
        .equals(labourId)
        .toArray();

      const referral = await db.referrals
        .where('labour_id')
        .equals(labourId)
        .first();

      if (referral) {
        const dest = await db.facilities.get(referral.destination_facility_id);
        const ambulance = referral.ambulance_id ? await db.ambulances.get(referral.ambulance_id) : null;
        activeReferral = {
          ...referral,
          dest_name: dest?.name || 'Hôpital de Référence',
          assigned_ambulance: ambulance
        };
      }
    }

    const facilities = await db.facilities.toArray();

    return {
      labour,
      pregnancy,
      patient,
      partogram,
      entries,
      alerts,
      activeReferral,
      facilities: facilities.filter(f => f.id !== user?.facility.id) // Candidate target centers
    };
  }, [labourId, user]);

  const handleSaveObservation = async (entryData: any) => {
    if (!data || !data.partogram) return;
    await apiService.addPartogramEntry(data.partogram.id, entryData);
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labourId || !user || !destFacilityId) return;

    try {
      await apiService.initiateReferral({
        labour_id: labourId,
        source_facility_id: user.facility.id,
        destination_facility_id: destFacilityId,
        initiated_by: user.id,
        reason: referralReason || 'Alerte clinique critique sur le partogramme.'
      });
      setShowReferralModal(false);
      setDestFacilityId('');
      setReferralReason('');
    } catch (err) {
      console.error('Failed to trigger referral:', err);
    }
  };

  const handleCloseLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labourId || !data || !data.partogram || !data.labour) return;

    const partogramId = data.partogram.id;
    const pregnancyId = data.labour.pregnancy_id;

    try {
      await db.transaction('rw', [db.labours, db.partograms, db.pregnancies, db.sync_queue], async () => {
        // Update labour
        await db.labours.update(labourId, {
          labour_status: 'COMPLETED',
          delivery_type: deliveryType,
          outcome: deliveryOutcome
        });

        // Update partogram
        await db.partograms.update(partogramId, {
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        });

        // Update pregnancy status
        await db.pregnancies.update(pregnancyId, {
          status: 'DELIVERED'
        });

        // Sync local updates
        await db.sync_queue.add({
          action: 'ADD_ENTRY', // Standard tag
          payload: { labourId, status: 'COMPLETED', deliveryType, deliveryOutcome },
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
      });
      
      setShowOutcomeModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = () => {
    if (!data || !patient) return;
    
    const exportData = {
      exported_at: new Date().toISOString(),
      patient: {
        id: patient.id,
        patient_code: patient.patient_code,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        phone: patient.phone,
        address: patient.address,
        blood_group: patient.blood_group,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone
      },
      pregnancy: pregnancy ? {
        id: pregnancy.id,
        gravidity: pregnancy.gravidity,
        parity: pregnancy.parity,
        estimated_delivery_date: pregnancy.estimated_delivery_date,
        gestational_age_weeks: pregnancy.gestational_age_weeks,
        risk_level: pregnancy.risk_level,
        status: pregnancy.status
      } : null,
      labour: labour ? {
        id: labour.id,
        facility_id: labour.facility_id,
        admitted_by: labour.admitted_by,
        admission_datetime: labour.admission_datetime,
        labour_status: labour.labour_status,
        delivery_type: labour.delivery_type,
        outcome: labour.outcome
      } : null,
      partogram_entries: entries.map(e => ({
        observation_time: e.observation_time,
        cervical_dilation: e.cervical_dilation,
        fetal_heart_rate: e.fetal_heart_rate,
        contractions_per_10min: e.contractions_per_10min,
        contraction_duration_secs: e.contraction_duration_secs,
        maternal_temperature: e.maternal_temperature,
        maternal_pulse: e.maternal_pulse,
        systolic_bp: e.systolic_bp,
        diastolic_bp: e.diastolic_bp,
        fetal_station: e.fetal_station,
        membrane_status: e.membrane_status,
        amniotic_fluid_status: e.amniotic_fluid_status,
        notes: e.notes
      })),
      alerts: alerts.map(a => ({
        alert_level: a.alert_level,
        alert_type: a.alert_type,
        alert_message: a.alert_message,
        generated_at: a.generated_at,
        resolved_at: a.resolved_at
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `partogramme_${patient.first_name.toLowerCase()}_${patient.last_name.toLowerCase()}_${patient.patient_code}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 border-4 border-status-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { patient, pregnancy, labour, entries, alerts, activeReferral, facilities } = data;

  const isLabourActive = labour.labour_status === 'ACTIVE';
  const isTransferred = labour.labour_status === 'TRANSFERRED';
  const isCompleted = labour.labour_status === 'COMPLETED';

  return (
    <div className="space-y-6">
      
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 pb-4 border-b border-brand-border/20">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 bg-slate-900 border border-brand-border/20 rounded-xl text-brand-muted hover:text-white transition print-hidden">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center">
              {t('partograph_record')}{' '}
              {isLabourActive && <span className="ml-2.5 h-2.5 w-2.5 bg-status-green rounded-full animate-pulse glow-green" title={t('active_labour')} />}
              {isTransferred && <span className="ml-2.5 h-2.5 w-2.5 bg-status-orange rounded-full" title={t('transferred')} />}
              {isCompleted && <span className="ml-2.5 h-2.5 w-2.5 bg-sky-400 rounded-full" title={t('delivery_completed')} />}
            </h1>
            <p className="text-xs text-brand-muted mt-1">
              {t('patient_name')} : <span className="text-white font-bold">{patient?.first_name} {patient?.last_name}</span> &bull; Code : <span className="text-white font-mono">{patient?.patient_code}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Download / Export Dropdown */}
          <div className="relative print-hidden">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition border border-brand-border/40 shadow-md"
            >
              <Download className="mr-1.5 h-4 w-4 text-slate-400" />
              {t('telecharger')}
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel shadow-2xl py-1.5 z-50 border border-brand-border/50">
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    window.print();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition"
                >
                  {t('imprimer_pdf')}
                </button>
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    handleExportJson();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition"
                >
                  {t('exporter_json')}
                </button>
              </div>
            )}
          </div>

          {isLabourActive && (
            <>
              {(user?.role.name === 'MIDWIFE' || user?.role.name === 'NURSE') && (
                <button
                  onClick={() => setShowObsDrawer(true)}
                  className="flex items-center px-4 py-2.5 bg-gradient-to-r from-status-orange to-[#f43f5e] hover:brightness-110 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-lg print-hidden"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t('saisir_obs')}
                </button>
              )}
              
              {(user?.role.name === 'MIDWIFE' || user?.role.name === 'PHYSICIAN') && (
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-status-orange hover:text-white font-bold rounded-xl text-xs transition border border-status-orange/30 shadow-md print-hidden"
                >
                  <Send className="mr-1.5 h-4 w-4 text-status-orange" />
                  {t('transferer')}
                </button>
              )}

              {(user?.role.name === 'PHYSICIAN' || user?.role.name === 'MIDWIFE') && (
                <button
                  onClick={() => setShowOutcomeModal(true)}
                  className="flex items-center px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold rounded-xl text-xs transition border border-sky-500/30 print-hidden"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4 text-sky-400" />
                  {t('cloturer')}
                </button>
              )}
            </>
          )}

          {isTransferred && (
            <span className="px-3.5 py-2 bg-status-orange/15 text-status-orange border border-status-orange/30 rounded-xl text-xs font-bold flex items-center print-hidden">
              <Truck className="h-4 w-4 mr-2" /> {t('patient_transferred')}
            </span>
          )}

          {isCompleted && (
            <span className="px-3.5 py-2 bg-status-green/15 text-status-green border border-status-green/30 rounded-xl text-xs font-bold flex items-center print-hidden">
              <CheckCircle className="h-4 w-4 mr-2" /> {t('delivery_done')} ({labour.delivery_type})
            </span>
          )}
        </div>
      </div>

      {/* 2. Patient Clinical Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/40 border border-brand-border/20 p-4 rounded-2xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-muted">{t('gestity_parity')}</span>
          <p className="text-sm font-bold text-white mt-1">G{pregnancy?.gravidity} / P{pregnancy?.parity}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-muted">{t('gestational_weeks')}</span>
          <p className="text-sm font-bold text-white mt-1">{pregnancy?.gestational_age_weeks} {language === 'fr' ? 'SA' : 'GW'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-muted">{t('risk_factor')}</span>
          <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
            pregnancy?.risk_level === 'HIGH' ? 'bg-status-red/15 text-status-red' :
            pregnancy?.risk_level === 'MEDIUM' ? 'bg-status-orange/15 text-status-orange' :
            'bg-status-green/15 text-status-green'
          }`}>
            {t('risk_level_label')} {pregnancy?.risk_level}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-muted">{t('admission_time')}</span>
          <p className="text-sm font-bold text-white mt-1 flex items-center">
            <Clock className="h-4 w-4 mr-1 text-slate-500" />
            {new Date(labour.admission_datetime).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 3. Main content grid: Dilation charts & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts & Graphs Panel (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <PartogramChart entries={entries} alerts={alerts} startedAt={labour.admission_datetime} />

          {/* Dilation Timeline Log */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">{t('clinical_observations_history')}</h3>
            <div className="overflow-x-auto">
              {entries.length === 0 ? (
                <p className="text-xs text-brand-muted py-4 text-center">{t('no_clinical_observations')}</p>
              ) : (
                <table className="min-w-full divide-y divide-brand-border/20 text-xs">
                  <thead>
                    <tr>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('time_label')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('dilation')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('fhr_bpm')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('contractions')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('vitals_label')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('membranes_fluid')}</th>
                      <th scope="col" className="pb-3 text-left font-semibold text-brand-muted">{t('notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {entries.slice().reverse().map((ent) => (
                      <tr key={ent.id} className="hover:bg-slate-900/30 transition">
                        <td className="py-3 whitespace-nowrap text-white">
                          {new Date(ent.observation_time).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 font-bold text-status-red">{ent.cervical_dilation} cm</td>
                        <td className="py-3 font-semibold text-status-green font-mono">{ent.fetal_heart_rate}</td>
                        <td className="py-3 font-semibold text-status-orange">
                          {ent.contractions_per_10min} {t('contractions_unit')} ({ent.contraction_duration_secs}s)
                        </td>
                        <td className="py-3 text-slate-300">
                          {ent.maternal_temperature}°C &bull; {ent.maternal_pulse} bpm &bull; {ent.systolic_bp}/{ent.diastolic_bp}
                        </td>
                        <td className="py-3 font-medium text-slate-400">
                          {ent.membrane_status === 'INTACT' ? t('intact') : t('ruptured')}
                          {ent.membrane_status === 'RUPTURED' && ` (${ent.amniotic_fluid_status === 'CLEAR' ? t('fluid_clear') : ent.amniotic_fluid_status === 'MECONIUM' ? t('fluid_meconium') : t('fluid_bloody')})`}
                        </td>
                        <td className="py-3 text-brand-muted italic max-w-xs truncate" title={ent.notes}>
                          {ent.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Tracker & Clinical alerts status (Right 1 Column) */}
        <div className="space-y-6">
          
          {/* Active Referral Card (if patient is being transferred) */}
          {activeReferral && (
            <div className="glass-panel border border-status-orange/40 rounded-2xl p-5 bg-status-orange/5 space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border/20 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Truck className="h-5 w-5 text-status-orange mr-2" />
                  {t('referral_tracking')}
                </h3>
                <span className="text-[9px] font-bold bg-status-orange/20 text-status-orange border border-status-orange/30 px-2 py-0.5 rounded">
                  {activeReferral.referral_status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">{t('dest_hospital')}</span>
                  <span className="text-white font-medium">{activeReferral.dest_name}</span>
                </div>
                <div>
                  <span className="text-brand-muted block text-[10px] uppercase font-bold">{t('reason')}</span>
                  <p className="text-slate-300 mt-1 leading-normal italic">&quot;{activeReferral.reason}&quot;</p>
                </div>
                
                {/* Ambulance assignments details */}
                {activeReferral.assigned_ambulance ? (
                  <div className="p-3 bg-slate-900 border border-brand-border/40 rounded-xl space-y-2">
                    <span className="text-[9px] font-extrabold text-status-green uppercase block">{t('assigned_ambulance')}</span>
                    <div className="text-white font-semibold flex justify-between">
                      <span>{t('registration_label')} :</span>
                      <span className="font-mono">{activeReferral.assigned_ambulance.registration_number}</span>
                    </div>
                    <div className="text-white flex justify-between">
                      <span>{t('driver_label')} :</span>
                      <span>{activeReferral.assigned_ambulance.driver_name}</span>
                    </div>
                    <div className="text-white flex justify-between">
                      <span>{t('phone_label')} :</span>
                      <span className="font-mono">{activeReferral.assigned_ambulance.driver_phone}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/60 border border-dashed border-brand-border/30 rounded-xl text-center text-brand-muted text-[11px]">
                    {t('waiting_ambulance')}
                  </div>
                )}
              </div>

              {/* Handshake Simulation buttons for receiving facilities */}
              {isTransferred && activeReferral.referral_status === 'PENDING' && user?.role.name === 'GYNECOLOGIST' && (
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={async () => {
                      // Accept referral
                      await apiService.updateReferralStatus(activeReferral.id, 'ACCEPTED');
                    }}
                    className="flex-1 py-2 bg-status-green text-black font-bold rounded-lg text-xs hover:brightness-110"
                  >
                    {t('accept')}
                  </button>
                  <button
                    onClick={async () => {
                      await apiService.updateReferralStatus(activeReferral.id, 'DECLINED');
                    }}
                    className="flex-1 py-2 bg-status-red text-white font-bold rounded-lg text-xs hover:brightness-110"
                  >
                    {t('decline')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clinical Alerts list */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">{t('diagnostic_engine')}</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-brand-muted text-xs flex flex-col items-center space-y-2">
                <CheckCircle className="h-7 w-7 text-status-green" />
                <p>{t('alerts_engine_idle')}<br />{t('no_anomalies_detected')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(al => (
                  <div key={al.id} className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    al.alert_level === 'RED' ? 'bg-status-red/10 border-status-red/20 text-status-red' :
                    al.alert_level === 'ORANGE' ? 'bg-status-orange/10 border-status-orange/20 text-status-orange' :
                    'bg-status-yellow/10 border-status-yellow/20 text-status-yellow'
                  }`}>
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px]">{al.alert_type}</span>
                      <p className="mt-0.5 leading-relaxed text-slate-200">{al.alert_message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* --- Overlay Form Panel: Saisie Obs --- */}
      {showObsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0b0f19] h-full border-l border-brand-border/40 shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center border-b border-brand-border/20 pb-4 mb-4 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center">
                <Activity className="mr-2 h-5 w-5 text-status-red" />
                {t('enter_clinical_data')}
              </h3>
              <button onClick={() => setShowObsDrawer(false)} className="text-brand-muted hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
              <ObservationForm 
                onSave={handleSaveObservation} 
                onCancel={() => setShowObsDrawer(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Window: Initiate Referral --- */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel border border-brand-border/40 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowReferralModal(false)} className="absolute right-4 top-4 text-brand-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center border-b border-brand-border/20 pb-3 mb-4">
              <Send className="mr-2 h-5 w-5 text-status-orange" />
              {t('generate_emergency_referral')}
            </h3>

            <form onSubmit={handleCreateReferral} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">{t('receiving_hospital')}</label>
                <select 
                  required
                  value={destFacilityId} 
                  onChange={e => setDestFacilityId(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs"
                >
                  <option value="">{t('select_reference_center')}</option>
                  {facilities.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.type} - {fac.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">{t('clinical_reason_justification')}</label>
                <textarea 
                  rows={4} 
                  required
                  placeholder={t('justify_transfer_placeholder')} 
                  value={referralReason} 
                  onChange={e => setReferralReason(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs placeholder-slate-700" 
                />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-status-orange to-status-red text-white font-bold rounded-xl text-xs transition uppercase tracking-wider">
                {t('trigger_digital_transfer')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal Window: Close Labour --- */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm glass-panel border border-brand-border/40 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowOutcomeModal(false)} className="absolute right-4 top-4 text-brand-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center border-b border-brand-border/20 pb-3 mb-4">
              <CheckCircle className="mr-2 h-5 w-5 text-sky-400" />
              {t('enter_delivery_outcome')}
            </h3>

            <form onSubmit={handleCloseLabour} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">{t('delivery_mode')}</label>
                <select 
                  value={deliveryType} 
                  onChange={e => setDeliveryType(e.target.value as any)} 
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs"
                >
                  <option value="VAGINAL">{t('vaginal_spontaneous')}</option>
                  <option value="CESAREAN">{t('emergency_c_section')}</option>
                  <option value="FORCEPS">{t('instrumental_delivery')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">{t('clinical_outcome')}</label>
                <select 
                  value={deliveryOutcome} 
                  onChange={e => setDeliveryOutcome(e.target.value as any)} 
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs"
                >
                  <option value="HEALTHY_MOU">{t('healthy_mother_child')}</option>
                  <option value="HEALTHY_CHILD">{t('healthy_child_mother_monitored')}</option>
                  <option value="COMPLICATED">{t('mother_complications')}</option>
                  <option value="STILLBORN">{t('stillborn_neonatal_death')}</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl text-xs transition uppercase tracking-wider">
                {t('save_close_file')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
