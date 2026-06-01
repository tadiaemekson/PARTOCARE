import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Users, UserPlus, Search, Calendar, Phone, MapPin, 
  Droplet, Plus, Clipboard, PlayCircle, Eye, Send, X 
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Navigation states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Modals / Panels
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddPregnancy, setShowAddPregnancy] = useState(false);

  // New Patient Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // New Pregnancy Form state
  const [gravidity, setGravidity] = useState(1);
  const [parity, setParity] = useState(0);
  const [edd, setEdd] = useState('');
  const [gestAge, setGestAge] = useState(38);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

  // Load patients and selected patient details reactively from Dexie DB
  const patients = useLiveQuery(() => {
    return db.patients.toArray();
  });

  const selectedPatientData = useLiveQuery(async () => {
    if (!selectedPatientId) return null;
    const patient = await db.patients.get(selectedPatientId);
    const pregnancies = await db.pregnancies
      .where('patient_id')
      .equals(selectedPatientId)
      .toArray();

    // Check if there is an active labor for any pregnancy
    const pregnancyIds = pregnancies.map(p => p.id);
    const activeLabours = await db.labours
      .where('pregnancy_id')
      .anyOf(pregnancyIds)
      .and(l => l.labour_status === 'ACTIVE')
      .toArray();

    return {
      patient,
      pregnancies,
      activeLabour: activeLabours.length > 0 ? activeLabours[0] : null
    };
  }, [selectedPatientId]);

  // Handle forms submissions
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPat = await apiService.createPatient({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        phone,
        address,
        blood_group: bloodGroup,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone
      });
      
      // Reset form
      setFirstName(''); setLastName(''); setDob(''); setPhone(''); 
      setAddress(''); setEmergencyName(''); setEmergencyPhone('');
      setShowAddPatient(false);
      
      // Auto select the new patient
      setSelectedPatientId(newPat.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPregnancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      await apiService.createPregnancy(selectedPatientId, {
        gravidity,
        parity,
        estimated_delivery_date: edd,
        gestational_age_weeks: gestAge,
        risk_level: riskLevel
      });
      setShowAddPregnancy(false);
      setGravidity(1); setParity(0); setEdd(''); setGestAge(38); setRiskLevel('LOW');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartLabour = async (pregnancyId: string) => {
    if (!user) return;
    try {
      const newLabour = await apiService.startLabour(
        pregnancyId,
        user.facility.id,
        user.id
      );
      navigate(`/partogram/${newLabour.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter patients
  const filteredPatients = patients?.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || p.patient_code.toLowerCase().includes(query) || p.phone.includes(query);
  }) || [];

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Patientes & Maternité</h1>
          <p className="text-sm text-brand-muted mt-1">Dossiers obstétriques et admissions en salle de naissance</p>
        </div>
        <button
          onClick={() => setShowAddPatient(true)}
          className="flex items-center px-4 py-2.5 bg-gradient-to-r from-status-orange to-[#f43f5e] hover:brightness-110 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow-lg"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Enregistrer Patiente
        </button>
      </div>

      {/* Main content grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Patient Directory List (1 Column) */}
        <div className="glass-panel rounded-2xl border border-brand-border/40 p-5 flex flex-col h-full lg:col-span-1">
          {/* Search box */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher nom, code, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#070b13] border border-brand-border/40 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-status-orange text-xs"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-10 text-brand-muted text-xs">
                Aucune patiente trouvée.
              </div>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between group ${
                    selectedPatientId === p.id 
                      ? 'bg-slate-800/60 border-status-orange/70 shadow-inner' 
                      : 'bg-slate-900/40 border-brand-border/20 hover:bg-slate-900/60 hover:border-brand-border/40'
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold transition truncate ${selectedPatientId === p.id ? 'text-status-orange' : 'text-white'}`}>
                      {p.first_name} {p.last_name}
                    </h4>
                    <p className="text-[10px] font-mono text-brand-muted mt-0.5">{p.patient_code}</p>
                  </div>
                  <Eye className="h-4 w-4 text-slate-600 group-hover:text-white transition" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Selected Patient Obstetrical Folder (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          {selectedPatientData ? (
            <div className="glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col h-full min-h-0">
              
              {/* Selected Patient Civil Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-brand-border/20 pb-5 shrink-0 space-y-4 sm:space-y-0">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-status-orange uppercase bg-status-orange/15 px-2.5 py-1 rounded">
                    {selectedPatientData.patient?.patient_code}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-3">
                    {selectedPatientData.patient?.first_name} {selectedPatientData.patient?.last_name}
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-brand-muted">
                    <span className="flex items-center"><Calendar className="h-4 w-4 mr-1 text-slate-500" /> {selectedPatientData.patient?.date_of_birth}</span>
                    <span className="flex items-center"><Phone className="h-4 w-4 mr-1 text-slate-500" /> {selectedPatientData.patient?.phone}</span>
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-slate-500" /> {selectedPatientData.patient?.address}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-slate-900/60 border border-brand-border/30 px-3.5 py-2.5 rounded-xl">
                  <Droplet className="h-5 w-5 text-status-red" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Groupe Sanguin</p>
                    <p className="text-sm font-black text-white mt-0.5">{selectedPatientData.patient?.blood_group}</p>
                  </div>
                </div>
              </div>

              {/* Obstetrical Folder content */}
              <div className="flex-1 overflow-y-auto py-5 space-y-6">
                
                {/* Emergency Contact */}
                <div className="p-4 bg-slate-900/40 rounded-xl border border-brand-border/20">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-brand-muted mb-2">Contact d'Urgence</h4>
                  <div className="text-xs text-white">
                    <span className="font-semibold">{selectedPatientData.patient?.emergency_contact_name}</span>
                    <span className="text-brand-muted block mt-1">{selectedPatientData.patient?.emergency_contact_phone}</span>
                  </div>
                </div>

                {/* Pregnancies History */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-white">Historique de Grossesse</h3>
                    <button
                      onClick={() => setShowAddPregnancy(true)}
                      className="inline-flex items-center text-xs font-bold text-status-orange hover:brightness-110"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Saisir Grossesse
                    </button>
                  </div>

                  {selectedPatientData.pregnancies.length === 0 ? (
                    <div className="p-5 text-center text-xs text-brand-muted border border-dashed border-brand-border/30 rounded-xl">
                      Aucune grossesse enregistrée pour cette patiente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatientData.pregnancies.map(preg => (
                        <div key={preg.id} className="p-4 bg-slate-900/60 border border-brand-border/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">Grossesse n°{preg.gravidity}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                preg.risk_level === 'HIGH' ? 'bg-status-red/10 text-status-red border border-status-red/20' :
                                preg.risk_level === 'MEDIUM' ? 'bg-status-orange/10 text-status-orange border border-status-orange/20' :
                                'bg-status-green/10 text-status-green border border-status-green/20'
                              }`}>
                                Risque {preg.risk_level}
                              </span>
                            </div>
                            <div className="text-[11px] text-brand-muted">
                              EDD (Prévu) : <span className="text-white font-medium">{preg.estimated_delivery_date}</span> &bull; {preg.gestational_age_weeks} semaines (Gest.) &bull; Parité : {preg.parity}
                            </div>
                          </div>

                          {/* Démarrer Travail Action */}
                          {preg.status === 'ACTIVE' && (
                            selectedPatientData.activeLabour ? (
                              <button
                                onClick={() => navigate(`/partogram/${selectedPatientData.activeLabour?.id}`)}
                                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-brand-border/40 shadow"
                              >
                                <PlayCircle className="h-4 w-4 mr-1.5 text-status-orange animate-pulse" />
                                Ouvrir Travail Actif
                              </button>
                            ) : (
                              (user?.role.name === 'MIDWIFE' || user?.role.name === 'PHYSICIAN') && (
                                <button
                                  onClick={() => handleStartLabour(preg.id)}
                                  className="flex items-center px-4 py-2 bg-gradient-to-r from-status-orange to-status-red text-white font-bold rounded-xl text-xs transition shadow-md hover:brightness-110"
                                >
                                  <PlayCircle className="h-4 w-4 mr-1.5" />
                                  Démarrer Travail
                                </button>
                              )
                            )
                          )}
                          
                          {preg.status === 'DELIVERED' && (
                            <span className="text-xs text-status-green font-bold flex items-center">
                              <Clipboard className="h-4 w-4 mr-1" /> Accouchée (Terminé)
                            </span>
                          )}

                          {preg.status === 'REFERRED' && (
                            <span className="text-xs text-status-orange font-bold flex items-center">
                              <Send className="h-4 w-4 mr-1" /> Transférée
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col items-center justify-center h-full text-brand-muted text-center space-y-4">
              <Users className="h-14 w-14 text-slate-700" />
              <div>
                <h3 className="text-base font-bold text-white">Sélectionnez une patiente</h3>
                <p className="text-xs text-brand-muted mt-1.5 max-w-sm">Choisissez une patiente dans le registre à gauche pour afficher son dossier obstétrical, son historique clinique ou démarrer son admission.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Overlay Form Panel: Add Patient --- */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b0f19] h-full border-l border-brand-border/40 shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center border-b border-brand-border/20 pb-4 mb-4 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-status-orange" />
                Enregistrer une Patiente
              </h3>
              <button onClick={() => setShowAddPatient(false)} className="text-brand-muted hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Prénom</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom de famille</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Date de naissance</label>
                <input type="date" required value={dob} onChange={e => setDob(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Téléphone</label>
                  <input type="tel" required placeholder="+237" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Gr. Sanguin</label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs">
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Adresse de résidence</label>
                <input type="text" required placeholder="Quartier, Ville" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-brand-border/20 space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-status-orange">Contact Proche de Confiance</h4>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom complet du proche</label>
                  <input type="text" required value={emergencyName} onChange={e => setEmergencyName(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/45 rounded-lg text-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Téléphone du proche</label>
                  <input type="tel" required value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/45 rounded-lg text-white text-xs" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-status-orange to-[#f43f5e] text-white font-bold rounded-xl text-xs transition uppercase tracking-wider">
                Enregistrer la patiente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal Window: Add Pregnancy --- */}
      {showAddPregnancy && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm glass-panel border border-brand-border/40 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setShowAddPregnancy(false)} className="absolute right-4 top-4 text-brand-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center border-b border-brand-border/20 pb-3 mb-4">
              <Clipboard className="mr-2 h-5 w-5 text-status-orange" />
              Saisir une Grossesse Actuelle
            </h3>

            <form onSubmit={handleRegisterPregnancy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Gestité (Gravida)</label>
                  <input type="number" min={1} required value={gravidity} onChange={e => setGravidity(Number(e.target.value))} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Parité (Para)</label>
                  <input type="number" min={0} required value={parity} onChange={e => setParity(Number(e.target.value))} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">EDD (Date Accouchement Prévue)</label>
                <input type="date" required value={edd} onChange={e => setEdd(e.target.value)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Semaines d'Aménorrhée</label>
                  <input type="number" min={20} max={45} required value={gestAge} onChange={e => setGestAge(Number(e.target.value))} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Niveau de Risque</label>
                  <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as any)} className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs font-bold text-white">
                    <option className="text-status-green" value="LOW">FAIBLE</option>
                    <option className="text-status-orange" value="MEDIUM">MODÉRÉ</option>
                    <option className="text-status-red" value="HIGH">ÉLEVÉ</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-status-orange to-[#f43f5e] text-white font-bold rounded-xl text-xs transition uppercase tracking-wider">
                Sauvegarder la Grossesse
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
