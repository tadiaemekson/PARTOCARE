import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, Truck, Phone, CheckCircle, 
  ShieldAlert, ArrowRight
} from 'lucide-react';

export const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [showAmbulanceSelect, setShowAmbulanceSelect] = useState(false);

  // Reactive IndexedDB queries
  const referrals = useLiveQuery(async () => {
    return await apiService.getReferrals();
  });

  const ambulances = useLiveQuery(() => {
    return db.ambulances.toArray();
  });

  if (!user || !referrals || !ambulances) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 border-4 border-status-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter referrals depending on user's facility and role
  const outboundRefs = referrals.filter(r => r.source_facility_id === user.facility.id);
  const inboundRefs = referrals.filter(r => r.destination_facility_id === user.facility.id);
  
  const selectedRef = referrals.find(r => r.id === selectedRefId);
  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  const handleAssignAmbulance = async (ambulanceId: string) => {
    if (!selectedRefId) return;
    try {
      await apiService.assignAmbulance(selectedRefId, ambulanceId);
      setShowAmbulanceSelect(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (refId: string) => {
    try {
      await apiService.updateReferralStatus(refId, 'ACCEPTED');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineRequest = async (refId: string) => {
    try {
      await apiService.updateReferralStatus(refId, 'DECLINED');
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAdmission = async (refId: string) => {
    try {
      await apiService.updateReferralStatus(refId, 'ADMITTED');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Réseau de Référence Obstétricale</h1>
        <p className="text-sm text-brand-muted mt-1">Coordination des transferts critiques et régulation des ambulances</p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Transfer Requests Directory (1 Column) */}
        <div className="glass-panel rounded-2xl border border-brand-border/40 p-5 flex flex-col h-full lg:col-span-1">
          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            
            {/* 1. Inbound Requests (Demandes Entrantes) */}
            {inboundRefs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold text-status-orange tracking-wider px-1">Demandes Entrantes (Réception)</h3>
                {inboundRefs.map(ref => (
                  <button
                    key={ref.id}
                    onClick={() => setSelectedRefId(ref.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col space-y-2 ${
                      selectedRefId === ref.id 
                        ? 'bg-slate-800/60 border-status-orange/70 shadow-inner' 
                        : 'bg-slate-900/40 border-brand-border/20 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-sm text-white truncate max-w-[150px]">{ref.patient_name}</span>
                      <span className="text-[9px] font-bold bg-status-orange/15 text-status-orange border border-status-orange/30 px-1.5 py-0.5 rounded">
                        {ref.referral_status}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-muted truncate w-full">
                      De : <span className="text-white font-medium">{ref.source_facility_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Outbound Requests (Demandes Envoyées) */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider px-1">Demandes Envoyées (Évacuations)</h3>
              {outboundRefs.length === 0 ? (
                <div className="text-center py-6 text-brand-muted text-xs">Aucune évacuation en cours.</div>
              ) : (
                outboundRefs.map(ref => (
                  <button
                    key={ref.id}
                    onClick={() => setSelectedRefId(ref.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col space-y-2 ${
                      selectedRefId === ref.id 
                        ? 'bg-slate-800/60 border-status-orange/70 shadow-inner' 
                        : 'bg-slate-900/40 border-brand-border/20 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-sm text-white truncate max-w-[150px]">{ref.patient_name}</span>
                      <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${
                        ref.referral_status === 'ADMITTED' ? 'bg-status-green/10 text-status-green border-status-green/20' :
                        ref.referral_status === 'IN_TRANSIT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-status-orange/10 text-status-orange border-status-orange/20'
                      }`}>
                        {ref.referral_status}
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-muted truncate w-full">
                      Vers : <span className="text-white font-medium">{ref.destination_facility_name}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Detailed Tracker & Ambulance Dispatch (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          {selectedRef ? (
            <div className="glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col h-full min-h-0 overflow-y-auto space-y-6">
              
              {/* Transfer Overview */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-brand-border/20 space-y-4 sm:space-y-0">
                <div>
                  <span className="text-[10px] font-bold bg-slate-900 border border-brand-border/40 px-2 py-1 rounded text-brand-muted uppercase font-mono">
                    ID Transfert : {selectedRef.id.substring(0, 8)}
                  </span>
                  <h2 className="text-lg font-black text-white mt-3 flex items-center">
                    {selectedRef.patient_name}
                    <ArrowRight className="h-4 w-4 mx-2 text-brand-muted" />
                    <span className="text-status-orange">{selectedRef.destination_facility_name}</span>
                  </h2>
                  <p className="text-xs text-brand-muted mt-1.5">
                    Envoyée par : <span className="text-white font-medium">{selectedRef.source_facility_name}</span>
                  </p>
                </div>

                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${
                  selectedRef.referral_status === 'ADMITTED' ? 'bg-status-green/10 text-status-green border-status-green/30' :
                  selectedRef.referral_status === 'IN_TRANSIT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                  'bg-status-orange/10 text-status-orange border-status-orange/30 animate-pulse'
                }`}>
                  {selectedRef.referral_status === 'PENDING' ? 'En Attente de Validation' :
                   selectedRef.referral_status === 'ACCEPTED' ? 'Demande Acceptée' :
                   selectedRef.referral_status === 'IN_TRANSIT' ? 'En Transit (Ambulance)' :
                   selectedRef.referral_status === 'ADMITTED' ? 'Patiente Admise' : 'Déclinée'}
                </span>
              </div>

              {/* Patient clinical reasons */}
              <div className="p-4 bg-status-red/5 border border-status-red/20 rounded-xl space-y-1.5">
                <h4 className="text-[10px] uppercase font-bold text-status-red tracking-wider flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1.5" /> Justification Clinique
                </h4>
                <p className="text-xs text-slate-200 leading-normal italic">&quot;{selectedRef.reason}&quot;</p>
              </div>

              {/* Evacuation Map simulation */}
              <div className="p-5 bg-[#080d17] border border-brand-border/40 rounded-2xl space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Tracé Routier de Référence</h4>
                <div className="relative h-20 bg-slate-950/80 rounded-xl border border-brand-border/15 flex items-center justify-between px-6 overflow-hidden">
                  
                  {/* Dotted path line */}
                  <div className="absolute left-12 right-12 h-0.5 border-t-2 border-dashed border-slate-700 top-1/2 -translate-y-1/2 z-0" />
                  
                  {selectedRef.referral_status === 'IN_TRANSIT' && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 animate-bounce">
                      <Truck className="h-6 w-6 text-status-orange animate-pulse" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col items-center space-y-1.5">
                    <div className="h-7 w-7 rounded-full bg-slate-900 border border-brand-border/40 flex items-center justify-center text-xs font-bold text-brand-muted">A</div>
                    <span className="text-[9px] text-brand-muted">{selectedRef.source_facility_name.split(' ').pop()}</span>
                  </div>

                  <div className="text-[10px] font-mono text-brand-muted relative z-10 flex flex-col items-center">
                    <span>32 km</span>
                    <span className="text-[8px] mt-0.5 text-slate-600">Est. 28 min</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center space-y-1.5">
                    <div className="h-7 w-7 rounded-full bg-slate-900 border border-brand-border/40 flex items-center justify-center text-xs font-bold text-brand-muted">B</div>
                    <span className="text-[9px] text-brand-muted">{selectedRef.destination_facility_name.split(' ').pop()}</span>
                  </div>
                </div>
              </div>

              {/* Handshake Controls */}
              <div className="pt-2">
                
                {/* 1. If Pending and user is at recipient facility: Accept or Decline */}
                {selectedRef.referral_status === 'PENDING' && selectedRef.destination_facility_id === user.facility.id && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleAcceptRequest(selectedRef.id)}
                      className="flex-1 py-3 bg-status-green text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition"
                    >
                      Accepter et Réserver un lit
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(selectedRef.id)}
                      className="flex-1 py-3 border border-status-red/40 text-status-red font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-status-red/10 transition"
                    >
                      Décliner (Capacité dépassée)
                    </button>
                  </div>
                )}

                {/* 2. If Accepted: Assign Ambulance */}
                {selectedRef.referral_status === 'ACCEPTED' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Affectation Logistique d'Évacuation</h4>
                      <span className="text-[10px] text-brand-muted">{availableAmbulances.length} ambulance(s) dispo</span>
                    </div>

                    {!showAmbulanceSelect ? (
                      <button
                        onClick={() => setShowAmbulanceSelect(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Affecter un véhicule d'urgence
                      </button>
                    ) : (
                      <div className="space-y-2 border border-brand-border/20 rounded-xl p-4 bg-slate-900/40">
                        {availableAmbulances.length === 0 ? (
                          <p className="text-xs text-status-yellow text-center py-2">
                            Aucune ambulance disponible au district pour le moment. Veuillez patienter ou appeler le district.
                          </p>
                        ) : (
                          <div className="divide-y divide-brand-border/10">
                            {availableAmbulances.map(amb => (
                              <div key={amb.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center">
                                    <Truck className="h-4 w-4 mr-1.5 text-slate-400" />
                                    {amb.registration_number} &bull; Driver: {amb.driver_name}
                                  </div>
                                  <div className="text-[10px] text-brand-muted mt-1 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" /> {amb.driver_phone}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssignAmbulance(amb.id)}
                                  className="px-3.5 py-1.5 bg-status-orange text-white text-[10px] font-bold rounded-lg hover:brightness-110 transition"
                                >
                                  Dépêcher
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setShowAmbulanceSelect(false)}
                          className="w-full mt-2 py-1.5 bg-slate-800 text-brand-muted hover:text-white text-[10px] font-bold rounded-lg border border-brand-border/30"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. If In Transit: Receive patient (Admit) */}
                {selectedRef.referral_status === 'IN_TRANSIT' && selectedRef.destination_facility_id === user.facility.id && (
                  <div className="bg-slate-900 border border-brand-border/20 p-5 rounded-2xl space-y-4">
                    <div className="text-center text-xs text-brand-muted leading-relaxed">
                      L'ambulance <span className="text-white font-bold">{selectedRef.assigned_ambulance?.registration_number}</span> est en route.<br />
                      Préparez la salle d'accouchement ou le bloc d'urgence.
                    </div>
                    <button
                      onClick={() => handleConfirmAdmission(selectedRef.id)}
                      className="w-full py-3.5 bg-status-green text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmer l'Arrivée &amp; l'Admission
                    </button>
                  </div>
                )}

                {/* 4. Synced / Completed Transfer */}
                {selectedRef.referral_status === 'ADMITTED' && (
                  <div className="p-4 bg-status-green/5 border border-status-green/20 rounded-xl text-center text-xs text-status-green flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span>Dossier de transfert finalisé. La patiente a été admise à {selectedRef.destination_facility_name}.</span>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col items-center justify-center h-full text-brand-muted text-center space-y-4">
              <Send className="h-14 w-14 text-slate-700" />
              <div>
                <h3 className="text-base font-bold text-white">Sélectionnez un transfert</h3>
                <p className="text-xs text-brand-muted mt-1.5 max-w-sm">Choisissez un transfert dans la liste de gauche pour en suivre la coordination logistique, affecter une ambulance ou valider l'admission hospitalière.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
