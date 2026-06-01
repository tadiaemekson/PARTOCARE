import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedDatabase } from '../services/db';
import { syncManager } from '../services/sync';
import { 
  Settings, Database, Server, Smartphone, 
  MapPin, CheckCircle, RefreshCw, Trash2
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [waKey, setWaKey] = useState('wa_bus_live_c18a287a9bc0...');
  const [syncUrl, setSyncUrl] = useState('https://api.partocare.cm/v1');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reactive DB queries
  const facilities = useLiveQuery(() => {
    return db.facilities.toArray();
  });

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
    if (confirm('Voulez-vous vraiment vider la base de données IndexedDB locale ?')) {
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

  const handleSeedMock = async () => {
    await seedDatabase();
    setSuccessMsg('Données cliniques de démonstration chargées.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleForceSync = async () => {
    await syncManager.syncOutbox();
    setSuccessMsg('Indexation et synchronisation forcée complétées.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center">
          <Settings className="h-7 w-7 mr-2.5 text-status-orange" />
          Administration Système
        </h1>
        <p className="text-sm text-brand-muted mt-1">Supervision de l'état système, synchronisations et passerelles</p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-status-green/10 border border-status-green/30 text-status-green rounded-xl flex items-center space-x-2 text-xs font-bold">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Forms for config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* WhatsApp Gateway Config */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6">
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

          {/* Connected Facilities Directory */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 text-sky-400 mr-2" />
              Répertoire des Structures du District
            </h3>

            <div className="divide-y divide-brand-border/20 text-xs">
              {facilities?.map(fac => (
                <div key={fac.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center first:pt-0 last:pb-0 gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{fac.name}</h4>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Type : {fac.type} &bull; District : {fac.district} &bull; Contact : {fac.phone}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-brand-muted font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-brand-border/15">
                    <span>GPS: {fac.latitude.toFixed(4)}, {fac.longitude.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 3: DB & Synchronization status */}
        <div className="space-y-6">
          
          {/* IndexedDB Statistics */}
          <div className="glass-panel border border-brand-border/40 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Database className="h-5 w-5 text-status-orange mr-2" />
              Console Base Locale (IndexedDB)
            </h3>
            
            <div className="divide-y divide-brand-border/10 text-xs space-y-2.5">
              {[
                { name: 'Patientes enregistrées', count: dbCounts?.patients || 0 },
                { name: 'Dossiers grossesses', count: dbCounts?.pregnancies || 0 },
                { name: 'Sessions de travails', count: dbCounts?.labours || 0 },
                { name: 'Partogrammes tracés', count: dbCounts?.partograms || 0 },
                { name: 'Observations cliniques', count: dbCounts?.entries || 0 },
                { name: 'Alertes générées', count: dbCounts?.alerts || 0 },
                { name: 'Fiches de références', count: dbCounts?.referrals || 0 },
                { name: 'File de synchronisation', count: dbCounts?.syncQueue || 0, isQueue: true }
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
                onClick={handleSeedMock}
                className="w-full py-2.5 bg-slate-900 border border-brand-border/40 hover:bg-slate-800 rounded-xl text-xs font-bold text-white flex items-center justify-center transition"
              >
                <Server className="h-4 w-4 mr-2 text-status-green" />
                Recharger données de Démo
              </button>
              <button
                onClick={handleResetDatabase}
                className="w-full py-2.5 bg-status-red/10 border border-status-red/30 hover:bg-status-red/20 rounded-xl text-xs font-bold text-status-red flex items-center justify-center transition"
              >
                <Trash2 className="h-4 w-4 mr-2 text-status-red" />
                Vider le Cache IndexedDB
              </button>
            </div>
          </div>

          {/* Sync API config */}
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

      </div>

    </div>
  );
};
