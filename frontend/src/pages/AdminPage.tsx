import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { syncManager } from '../services/sync';
import { 
  Settings, Database, Server, Smartphone, 
  MapPin, CheckCircle, RefreshCw, Trash2, PlusCircle, Building,
  UserPlus, Users, Edit, X
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [waKey, setWaKey] = useState('wa_bus_live_c18a287a9bc0...');
  const [syncUrl, setSyncUrl] = useState('https://partocare-production-vwfatb.laravel.cloud/');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab selection ('hospitals' | 'workers' | 'whatsapp' | 'system')
  const [activeTab, setActiveTab] = useState<'hospitals' | 'workers' | 'whatsapp' | 'system'>(() => {
    return user?.role.name === 'SYSTEM_ADMIN' ? 'hospitals' : 'workers';
  });

  // Nested sub-views selector ('list' | 'form') for Hospitals and Workers
  const [hospitalSubView, setHospitalSubView] = useState<'list' | 'form'>('list');
  const [workerSubView, setWorkerSubView] = useState<'list' | 'form'>('list');

  // Facility edit/creation state
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [facName, setFacName] = useState('');
  const [facType, setFacType] = useState('CMA');
  const [facRegion, setFacRegion] = useState('Centre');
  const [facDistrict, setFacDistrict] = useState('Bafia');
  const [facAddress, setFacAddress] = useState('');
  const [facPhone, setFacPhone] = useState('');
  const [facLat, setFacLat] = useState(4.67);
  const [facLng, setFacLng] = useState(11.23);

  // Facility Manager (Director) associated fields
  const [mgrFirstName, setMgrFirstName] = useState('');
  const [mgrLastName, setMgrLastName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrPassword, setMgrPassword] = useState('');

  // User edit/creation state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRoleId, setUserRoleId] = useState('r-midwife');
  const [userFacilityId, setUserFacilityId] = useState('');

  // Safety confirmation modal state for critical deletion
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'facility' | 'user';
    id: string;
    targetName: string;
  } | null>(null);
  const [deleteTypedConfirm, setDeleteTypedConfirm] = useState('');

  // Set default facility and role constraints based on user role
  useEffect(() => {
    if (user) {
      if (user.role.name === 'SYSTEM_ADMIN') {
        setUserRoleId('r-manager');
      } else {
        setUserFacilityId(user.facility.id);
        setUserRoleId('r-midwife');
      }
    }
  }, [user]);

  // Reactive DB queries
  const facilities = useLiveQuery(() => {
    return db.facilities.toArray();
  });

  const roles = useLiveQuery(() => {
    return db.roles.toArray();
  });

  const staffUsers = useLiveQuery(async () => {
    if (!user) return [];
    if (user.role.name === 'SYSTEM_ADMIN') {
      const allUsers = await db.users.toArray();
      return allUsers.filter(u => u.role_id === 'r-manager');
    } else {
      return await db.users.where('facility_id').equals(user.facility.id).toArray();
    }
  }, [user]);

  const dbCounts = useLiveQuery(async () => {
    return {
      patients: await db.patients.count(),
      pregnancies: await db.pregnancies.count(),
      labours: await db.labours.count(),
      partograms: await db.partograms.count(),
      entries: await db.partogram_entries.count(),
      alerts: await db.alerts.count(),
      referrals: await db.referrals.count(),
      syncQueue: await db.sync_queue.count()
    };
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Configurations système sauvegardées localement.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleResetDatabase = async () => {
    if (confirm('Voulez-vous vraiment réinitialiser la base de données locale ?')) {
      await db.transaction('rw', [
        db.patients, db.pregnancies, db.labours, db.partograms, 
        db.partogram_entries, db.alerts, db.referrals, db.sync_queue
      ], async () => {
        await db.patients.clear();
        await db.pregnancies.clear();
        await db.labours.clear();
        await db.partograms.clear();
        await db.partogram_entries.clear();
        await db.alerts.clear();
        await db.referrals.clear();
        await db.sync_queue.clear();
      });
      
      setSuccessMsg('Base de données réinitialisée. Rechargez la page.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleForceSync = async () => {
    await syncManager.syncOutbox();
    setSuccessMsg('Indexation et synchronisation forcée complétées.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) {
      alert("Le nom de la structure est requis.");
      return;
    }
    if (!mgrEmail.trim() || !mgrFirstName.trim() || !mgrLastName.trim()) {
      alert("L'adresse email, le prénom et le nom du Directeur/Manager sont requis.");
      return;
    }

    try {
      const facilityData = {
        name: facName,
        type: facType,
        region: facRegion,
        district: facDistrict,
        address: facAddress,
        phone: facPhone,
        latitude: Number(facLat),
        longitude: Number(facLng)
      };

      if (editingFacilityId) {
        // 1. Update facility
        await apiService.updateFacility(editingFacilityId, facilityData);
        
        // 2. Update or create associated Manager
        const existingManager = await db.users.where({ facility_id: editingFacilityId, role_id: 'r-manager' }).first();
        const managerData: any = {
          email: mgrEmail,
          first_name: mgrFirstName,
          last_name: mgrLastName,
          phone: mgrPhone,
          role_id: 'r-manager',
          facility_id: editingFacilityId
        };
        if (mgrPassword.trim()) {
          managerData.password = mgrPassword;
        }

        if (existingManager) {
          await apiService.updateUser(existingManager.id, managerData);
        } else {
          await apiService.createUser(managerData);
        }

        setSuccessMsg(`Structure "${facName}" et son Directeur mis à jour.`);
        setEditingFacilityId(null);
      } else {
        // 1. Create facility
        const newFac = await apiService.createFacility(facilityData);
        
        // 2. Create associated Manager
        const managerData = {
          email: mgrEmail,
          first_name: mgrFirstName,
          last_name: mgrLastName,
          phone: mgrPhone,
          role_id: 'r-manager',
          facility_id: newFac.id,
          password: mgrPassword || 'password'
        };
        await apiService.createUser(managerData);

        setSuccessMsg(`Structure "${facName}" enregistrée avec son Directeur.`);
      }

      setFacName('');
      setFacAddress('');
      setFacPhone('');
      setMgrFirstName('');
      setMgrLastName('');
      setMgrEmail('');
      setMgrPhone('');
      setMgrPassword('');
      setHospitalSubView('list'); // Return to list view
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to save facility:", err);
      alert(err.message || "Erreur lors de l'enregistrement de la structure.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userFirstName.trim() || !userLastName.trim()) {
      alert("L'adresse email, le prénom et le nom sont requis.");
      return;
    }

    const targetFacilityId = user?.role.name === 'SYSTEM_ADMIN' ? userFacilityId : user?.facility.id;
    if (!targetFacilityId) {
      alert("Veuillez sélectionner un centre de santé.");
      return;
    }

    try {
      const userData: any = {
        email: userEmail,
        first_name: userFirstName,
        last_name: userLastName,
        phone: userPhone,
        role_id: userRoleId,
        facility_id: targetFacilityId
      };

      if (userPassword.trim()) {
        userData.password = userPassword;
      }

      if (editingUserId) {
        await apiService.updateUser(editingUserId, userData);
        setSuccessMsg(`Personnel "${userFirstName} ${userLastName}" mis à jour avec succès.`);
        setEditingUserId(null);
      } else {
        if (!userPassword) {
          alert("Le mot de passe est obligatoire pour la création d'un compte.");
          return;
        }
        await apiService.createUser(userData);
        setSuccessMsg(`Personnel "${userFirstName} ${userLastName}" enregistré avec succès.`);
      }

      setUserEmail('');
      setUserFirstName('');
      setUserLastName('');
      setUserPhone('');
      setUserPassword('');
      setWorkerSubView('list'); // Return to list view
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to save worker:", err);
      alert(err.message || "Erreur lors de l'enregistrement du personnel.");
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmModal) return;
    const { type, id, targetName } = deleteConfirmModal;

    try {
      if (type === 'facility') {
        await apiService.deleteFacility(id);
        setSuccessMsg(`Structure "${targetName}" supprimée avec succès.`);
      } else {
        await apiService.deleteUser(id);
        setSuccessMsg(`Personnel "${targetName}" supprimé avec succès.`);
      }
      setDeleteConfirmModal(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Deletion error:", err);
      alert(err.message || "Erreur lors de la suppression.");
    }
  };

  const isSuperAdmin = user?.role.name === 'SYSTEM_ADMIN';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center">
          <Settings className="h-7 w-7 mr-2.5 text-status-orange" />
          {isSuperAdmin ? "Administration Système" : "Administration du Centre"}
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          {isSuperAdmin 
            ? "Supervision globale, gestion des structures de santé et configuration système" 
            : `Gestion des ressources et du personnel pour : ${user?.facility.name}`}
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-status-green/10 border border-status-green/30 text-status-green rounded-xl flex items-center space-x-2 text-xs font-bold">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Selector Bar (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="flex flex-wrap gap-2.5 pb-2 border-b border-brand-border/10">
          {[
            { id: 'hospitals', label: 'Structures Sanitaires', icon: Building },
            { id: 'workers', label: 'Directeurs d\'Hôpitaux', icon: Users },
            { id: 'whatsapp', label: 'Passerelle WhatsApp', icon: Smartphone },
            { id: 'system', label: 'Console & Synchro API', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setEditingFacilityId(null);
                  setEditingUserId(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  isActive 
                    ? 'bg-gradient-to-tr from-status-red to-status-orange text-white shadow-lg' 
                    : 'bg-slate-900 border border-brand-border/30 text-brand-muted hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Modular Tab Content Display */}
      <div className="space-y-6">

        {/* TAB 1: Hospitals & Facilities Management */}
        {isSuperAdmin && activeTab === 'hospitals' && (
          <div className="space-y-4">
            
            {/* Hospital Sub-menu Toggles */}
            <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-brand-border/20 max-w-md">
              <button
                onClick={() => setHospitalSubView('list')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition ${
                  hospitalSubView === 'list' 
                    ? 'bg-slate-900 text-status-orange border border-brand-border/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                Répertoire des structures
              </button>
              <button
                onClick={() => {
                  setHospitalSubView('form');
                  setEditingFacilityId(null);
                  setFacName('');
                  setFacAddress('');
                  setFacPhone('');
                  setMgrFirstName('');
                  setMgrLastName('');
                  setMgrEmail('');
                  setMgrPhone('');
                  setMgrPassword('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition ${
                  hospitalSubView === 'form' 
                    ? 'bg-slate-900 text-status-orange border border-brand-border/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {editingFacilityId ? "✏️ Modifier la structure" : "➕ Enregistrer une structure"}
              </button>
            </div>

            {/* Sub-view Rendering */}
            {hospitalSubView === 'form' ? (
              <div className="w-full">
                <div className="glass-panel border border-brand-border/40 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center">
                      <Building className="h-5 w-5 text-status-orange mr-2" />
                      {editingFacilityId ? "Modifier la Structure Sanitaire" : "Enregistrer une Nouvelle Structure Sanitaire"}
                    </h3>
                    {editingFacilityId && (
                      <button 
                        onClick={() => {
                          setEditingFacilityId(null);
                          setFacName('');
                          setFacAddress('');
                          setFacPhone('');
                          setMgrFirstName('');
                          setMgrLastName('');
                          setMgrEmail('');
                          setMgrPhone('');
                          setMgrPassword('');
                          setHospitalSubView('list');
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-muted hover:text-white transition text-[10px]"
                      >
                        <X className="h-3 w-3" />
                        <span>Annuler la modification</span>
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={handleCreateFacility} className="space-y-6 text-xs">
                    {/* Part 1: Hospital General details */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">
                        Informations de l'Établissement Sanitaire
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom de la structure *</label>
                          <input 
                            type="text" 
                            value={facName}
                            onChange={e => setFacName(e.target.value)}
                            placeholder="ex: CSI de Ndiki Nord"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Type de structure</label>
                          <select 
                            value={facType}
                            onChange={e => setFacType(e.target.value)}
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-medium"
                          >
                            <option value="CMA">CMA (Centre Médical d'Arrondissement)</option>
                            <option value="District Hospital">Hôpital de District (District Hospital)</option>
                            <option value="Regional Hospital">Hôpital Régional (Regional Hospital)</option>
                            <option value="Clinic">Clinique Privée / Autre</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Région</label>
                          <input 
                            type="text" 
                            value={facRegion}
                            onChange={e => setFacRegion(e.target.value)}
                            placeholder="ex: Centre"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">District Sanitaire</label>
                          <input 
                            type="text" 
                            value={facDistrict}
                            onChange={e => setFacDistrict(e.target.value)}
                            placeholder="ex: Bafia"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Téléphone contact</label>
                          <input 
                            type="text" 
                            value={facPhone}
                            onChange={e => setFacPhone(e.target.value)}
                            placeholder="ex: +237622112233"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Adresse / Localisation</label>
                          <input 
                            type="text" 
                            value={facAddress}
                            onChange={e => setFacAddress(e.target.value)}
                            placeholder="ex: Ndiki Ville, face Eglise"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Latitude (GPS) *</label>
                          <input 
                            type="number" 
                            step="0.000001"
                            value={facLat}
                            onChange={e => setFacLat(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono" 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Longitude (GPS) *</label>
                          <input 
                            type="number" 
                            step="0.000001"
                            value={facLng}
                            onChange={e => setFacLng(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono" 
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Associated Hospital Manager details */}
                    <div className="border-t border-brand-border/20 pt-5 space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-status-orange tracking-wider">
                        Directeur de l'Établissement (Maternity Manager)
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Prénom du Directeur *</label>
                          <input 
                            type="text" 
                            value={mgrFirstName}
                            onChange={e => setMgrFirstName(e.target.value)}
                            placeholder="ex: Chantal"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom du Directeur *</label>
                          <input 
                            type="text" 
                            value={mgrLastName}
                            onChange={e => setMgrLastName(e.target.value)}
                            placeholder="ex: Bella"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Adresse Email du Directeur *</label>
                          <input 
                            type="email" 
                            value={mgrEmail}
                            onChange={e => setMgrEmail(e.target.value)}
                            placeholder="ex: responsable@partocare.cm"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Téléphone du Directeur</label>
                          <input 
                            type="text" 
                            value={mgrPhone}
                            onChange={e => setMgrPhone(e.target.value)}
                            placeholder="ex: +237655889900"
                            className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">
                          {editingFacilityId ? "Nouveau mot de passe du Directeur (laisser vide si inchangé)" : "Mot de passe initial du Directeur *"}
                        </label>
                        <input 
                          type="password" 
                          value={mgrPassword}
                          onChange={e => setMgrPassword(e.target.value)}
                          placeholder="Mot de passe temporaire"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono"
                          required={!editingFacilityId}
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-gradient-to-tr from-status-red to-status-orange hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center justify-center">
                      {editingFacilityId ? <Edit className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                      {editingFacilityId ? "Sauvegarder les modifications" : "Enregistrer la structure et son Directeur"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="w-full glass-panel border border-brand-border/40 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-sky-400 mr-2" />
                  Répertoire des Structures
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {facilities?.map(fac => (
                    <div key={fac.id} className="p-4 bg-[#070b13]/60 border border-brand-border/20 rounded-2xl flex flex-col justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-xs">{fac.name}</h4>
                        <p className="text-[9px] text-brand-muted mt-1 leading-relaxed">
                          Type : {fac.type} &bull; Dist : {fac.district} <br />
                          Tél : {fac.phone || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-brand-border/10">
                        <span className="text-[8px] text-slate-500 font-mono">
                          GPS: {fac.latitude.toFixed(4)}, {fac.longitude.toFixed(4)}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <button 
                            onClick={async () => {
                              setEditingFacilityId(fac.id);
                              setFacName(fac.name);
                              setFacType(fac.type);
                              setFacRegion(fac.region);
                              setFacDistrict(fac.district);
                              setFacAddress(fac.address || '');
                              setFacPhone(fac.phone);
                              setFacLat(fac.latitude);
                              setFacLng(fac.longitude);
                              
                              // Load manager details
                              const mgr = await db.users.where({ facility_id: fac.id, role_id: 'r-manager' }).first();
                              if (mgr) {
                                setMgrFirstName(mgr.first_name);
                                setMgrLastName(mgr.last_name);
                                setMgrEmail(mgr.email);
                                setMgrPhone(mgr.phone || '');
                                setMgrPassword('');
                              } else {
                                setMgrFirstName('');
                                setMgrLastName('');
                                setMgrEmail('');
                                setMgrPhone('');
                                setMgrPassword('');
                              }
                              setHospitalSubView('form'); // Toggle view
                            }}
                            className="p-1.5 hover:bg-slate-800 text-sky-400 rounded transition"
                            title="Modifier"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setDeleteConfirmModal({
                                type: 'facility',
                                id: fac.id,
                                targetName: fac.name
                              });
                              setDeleteTypedConfirm('');
                            }}
                            className="p-1.5 hover:bg-status-red/10 text-status-red rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: Personnel & Workers Management */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            
            {/* Worker Sub-menu Toggles */}
            <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-brand-border/20 max-w-md">
              <button
                onClick={() => setWorkerSubView('list')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition ${
                  workerSubView === 'list' 
                    ? 'bg-slate-900 text-status-orange border border-brand-border/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                Répertoire du personnel
              </button>
              <button
                onClick={() => {
                  setWorkerSubView('form');
                  setEditingUserId(null);
                  setUserEmail('');
                  setUserFirstName('');
                  setUserLastName('');
                  setUserPhone('');
                  setUserPassword('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition ${
                  workerSubView === 'form' 
                    ? 'bg-slate-900 text-status-orange border border-brand-border/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {editingUserId ? "✏️ Modifier le personnel" : "➕ Enregistrer un personnel"}
              </button>
            </div>

            {/* Sub-view Rendering */}
            {workerSubView === 'form' ? (
              <div className="w-full">
                <div className="glass-panel border border-brand-border/40 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center">
                      <UserPlus className="h-5 w-5 text-status-orange mr-2" />
                      {editingUserId ? "Modifier la Fiche du Personnel" : "Enregistrer un Nouveau Personnel"}
                    </h3>
                    {editingUserId && (
                      <button 
                        onClick={() => {
                          setEditingUserId(null);
                          setUserEmail('');
                          setUserFirstName('');
                          setUserLastName('');
                          setUserPhone('');
                          setUserPassword('');
                          setWorkerSubView('list');
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-muted hover:text-white transition text-[10px]"
                      >
                        <X className="h-3 w-3" />
                        <span>Annuler la modification</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Prénom *</label>
                        <input 
                          type="text" 
                          value={userFirstName}
                          onChange={e => setUserFirstName(e.target.value)}
                          placeholder="ex: Jean"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom *</label>
                        <input 
                          type="text" 
                          value={userLastName}
                          onChange={e => setUserLastName(e.target.value)}
                          placeholder="ex: Ebolowa"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Adresse Email *</label>
                        <input 
                          type="email" 
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                          placeholder="ex: personnel@partocare.cm"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Téléphone contact</label>
                        <input 
                          type="text" 
                          value={userPhone}
                          onChange={e => setUserPhone(e.target.value)}
                          placeholder="ex: +237699887766"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">
                          {editingUserId ? "Nouveau mot de passe (laisser vide si inchangé)" : "Mot de passe initial *"}
                        </label>
                        <input 
                          type="password" 
                          value={userPassword}
                          onChange={e => setUserPassword(e.target.value)}
                          placeholder="password par défaut"
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono"
                          required={!editingUserId}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Rôle & Privilèges de l'agent</label>
                        <select 
                          value={userRoleId}
                          onChange={e => setUserRoleId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-medium"
                        >
                          {roles?.filter(r => {
                            if (isSuperAdmin) {
                              return r.id === 'r-manager';
                            } else {
                              return r.id !== 'r-admin';
                            }
                          }).map(role => (
                            <option key={role.id} value={role.id}>{role.name} ({role.description.split(' : ')[0]})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isSuperAdmin ? (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Structure Sanitaire d'affectation *</label>
                        <select 
                          value={userFacilityId}
                          onChange={e => setUserFacilityId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold"
                          required
                        >
                          <option value="">Sélectionnez un centre de santé</option>
                          {facilities?.map(fac => (
                            <option key={fac.id} value={fac.id}>{fac.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Structure Sanitaire (Hôpital)</label>
                        <input 
                          type="text" 
                          value={user?.facility.name || ''} 
                          disabled 
                          className="w-full px-3 py-2 bg-[#070b13]/60 border border-brand-border/20 rounded-lg text-slate-500 font-bold" 
                        />
                      </div>
                    )}

                    <button type="submit" className="px-4 py-2.5 bg-gradient-to-tr from-status-red to-status-orange hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center">
                      {editingUserId ? <Edit className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      {editingUserId ? "Sauvegarder les modifications" : "Enregistrer le personnel"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="w-full glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Users className="h-5 w-5 text-sky-400 mr-2" />
                  Répertoire du Personnel ({staffUsers?.length || 0})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {staffUsers?.map(u => {
                    const userRole = roles?.find(r => r.id === u.role_id);
                    const userFacility = facilities?.find(f => f.id === u.facility_id);
                    return (
                      <div key={u.id} className="p-4 bg-[#070b13]/60 border border-brand-border/20 rounded-2xl flex flex-col justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{u.first_name} {u.last_name}</h4>
                          <p className="text-[10px] text-brand-muted mt-0.5 truncate">{u.email}</p>
                          {isSuperAdmin && (
                            <p className="text-[9px] text-slate-500 mt-1 font-medium truncate">
                              🏥 {userFacility?.name || 'Structure Inconnue'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border/10">
                          <span className="px-2.5 py-0.5 rounded text-[8px] font-extrabold bg-slate-900 border border-brand-border/20 text-slate-300">
                            {userRole?.name || 'AGENT'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => {
                                setEditingUserId(u.id);
                                setUserFirstName(u.first_name);
                                setUserLastName(u.last_name);
                                setUserEmail(u.email);
                                setUserPhone(u.phone || '');
                                setUserPassword('');
                                setUserRoleId(u.role_id);
                                setUserFacilityId(u.facility_id);
                                setWorkerSubView('form'); // Switch sub-view
                              }}
                              className="p-1 hover:bg-slate-800 text-sky-400 rounded transition"
                              title="Modifier"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => {
                                if (u.id === user?.id) {
                                  alert("Vous ne pouvez pas supprimer votre propre compte depuis ce répertoire. Utilisez plutôt le volet profil.");
                                  return;
                                }
                                setDeleteConfirmModal({
                                  type: 'user',
                                  id: u.id,
                                  targetName: `${u.first_name} ${u.last_name}`
                                });
                                setDeleteTypedConfirm('');
                              }}
                              className="p-1 hover:bg-status-red/10 text-status-red rounded transition"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: WhatsApp Configuration */}
        {isSuperAdmin && activeTab === 'whatsapp' && (
          <div className="w-full glass-panel border border-brand-border/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center">
              <Smartphone className="h-5 w-5 text-status-orange mr-2" />
              Configuration Passerelle WhatsApp Business
            </h3>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Clé API WhatsApp (Méta Business Client)</label>
                <input 
                  type="text" 
                  value={waKey} 
                  onChange={e => setWaKey(e.target.value)} 
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white text-xs font-mono" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Numéro d'expéditeur officiel</label>
                  <input type="text" defaultValue="+237699001122" disabled className="w-full px-3 py-2 bg-[#070b13]/60 border border-brand-border/20 rounded-lg text-slate-500 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Template d'alerte critique</label>
                  <input type="text" defaultValue="partocare_alert_critical_v1" disabled className="w-full px-3 py-2 bg-[#070b13]/60 border border-brand-border/20 rounded-lg text-slate-500 text-xs" />
                </div>
              </div>

              <button type="submit" className="px-4 py-2 bg-slate-900 border border-brand-border/40 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition">
                Sauvegarder les clés
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: System Console & Sync API */}
        {isSuperAdmin && activeTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Side: Sync API Config */}
            <div className="lg:col-span-2">
              <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Server className="h-5 w-5 text-sky-400 mr-2" />
                  Serveur Central API
                </h3>
                
                <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-brand-muted mb-1">URL API Serveur</label>
                    <input 
                      type="text" 
                      value={syncUrl} 
                      onChange={e => setSyncUrl(e.target.value)} 
                      className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono" 
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-900 border border-brand-border/40 rounded-lg text-white font-bold transition">
                    Sauvegarder
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side: Local Sync Console */}
            <div className="lg:col-span-1">
              <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Database className="h-5 w-5 text-status-orange mr-2" />
                  Console Synchro Locale
                </h3>
                
                <div className="divide-y divide-brand-border/10 text-xs space-y-2.5">
                  {[
                    { name: 'File d\'attente de synchronisation', count: dbCounts?.syncQueue || 0, isQueue: true }
                  ].map(item => (
                    <div key={item.name} className="flex justify-between items-center py-2 first:pt-0">
                      <span className="text-brand-muted">{item.name}</span>
                      <span className={`font-bold font-mono ${item.isQueue && item.count > 0 ? 'text-status-orange animate-pulse' : 'text-white'}`}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* DB Developer Actions */}
                <div className="space-y-2 pt-3 border-t border-brand-border/20">
                  <button
                    onClick={handleForceSync}
                    className="w-full py-2.5 bg-slate-900 border border-brand-border/40 hover:bg-slate-800 rounded-xl text-xs font-bold text-white flex items-center justify-center transition"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 text-status-orange" />
                    Forcer la Synchronisation
                  </button>
                  <button
                    onClick={handleResetDatabase}
                    className="w-full py-2.5 bg-status-red/10 border border-status-red/30 hover:bg-status-red/20 rounded-xl text-xs font-bold text-status-red flex items-center justify-center transition"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-status-red" />
                    Réinitialiser la Base Locale
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Safety Deletion Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-brand-border/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-left">
            <div className="flex items-center space-x-2.5 text-status-red">
              <Trash2 className="h-6 w-6 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Confirmation de Suppression Critique</h3>
            </div>
            
            <p className="text-brand-muted leading-relaxed">
              Attention : Cette action est définitive et irréversible. Les données associées seront supprimées en local et synchronisées sur le serveur central.
            </p>
            
            <div className="p-3.5 bg-status-red/10 border border-status-red/20 text-status-red rounded-xl leading-normal">
              Pour confirmer la suppression de <strong>{deleteConfirmModal.targetName}</strong>, veuillez saisir son nom exact ci-dessous.
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-brand-muted">Saisir le nom exact pour confirmer</label>
              <input 
                type="text" 
                value={deleteTypedConfirm}
                onChange={e => setDeleteTypedConfirm(e.target.value)}
                placeholder={deleteConfirmModal.targetName}
                className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold placeholder-slate-700 focus:outline-none focus:border-status-red" 
              />
            </div>

            <div className="pt-2 flex space-x-3">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-900 border border-brand-border/40 hover:bg-slate-800 rounded-xl text-white font-bold transition"
              >
                Annuler
              </button>
              <button 
                type="button"
                disabled={deleteTypedConfirm.trim() !== deleteConfirmModal.targetName.trim()}
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-status-red text-white font-bold rounded-xl shadow-lg transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
