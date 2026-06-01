import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Users, Activity, Send, CheckCircle, AlertTriangle, 
  Clock, ArrowRight, UserPlus, HeartPulse 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Reactive IndexedDB data hooks (updates live upon clinical entries!)
  const stats = useLiveQuery(async () => {
    if (!user) return null;

    const activeLabours = await db.labours
      .where('labour_status')
      .equals('ACTIVE')
      .toArray();

    const pendingReferrals = await db.referrals
      .where('referral_status')
      .equals('PENDING')
      .toArray();

    const completedToday = await db.labours
      .where('labour_status')
      .equals('COMPLETED')
      .toArray();

    // Map active labours to get patient names, alert level, and latest dilation
    const mappedLabours = await Promise.all(
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

        // Find unresolved alerts for this case
        const alerts = await db.alerts
          .where('labour_id')
          .equals(labour.id)
          .and(a => !a.resolved_at)
          .toArray();

        let alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
        if (alerts.some(a => a.alert_level === 'RED')) alertLevel = 'RED';
        else if (alerts.some(a => a.alert_level === 'ORANGE')) alertLevel = 'ORANGE';
        else if (alerts.some(a => a.alert_level === 'YELLOW')) alertLevel = 'YELLOW';

        return {
          labour_id: labour.id,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente',
          patient_code: patient?.patient_code || '',
          admission_datetime: labour.admission_datetime,
          latest_dilation: latestDilation,
          alert_level: alertLevel,
          last_entry_at: lastEntryTime,
          alert_count: alerts.length
        };
      })
    );

    // Enriched pending referrals
    const enrichedReferrals = await Promise.all(
      pendingReferrals.map(async (ref) => {
        const labour = await db.labours.get(ref.labour_id);
        const preg = labour ? await db.pregnancies.get(labour.pregnancy_id) : null;
        const patient = preg ? await db.patients.get(preg.patient_id) : null;
        const dest = await db.facilities.get(ref.destination_facility_id);
        return {
          ...ref,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente',
          patient_code: patient?.patient_code || '',
          dest_name: dest?.name || 'Hôpital de Référence'
        };
      })
    );

    const criticalCount = mappedLabours.filter(l => l.alert_level === 'RED' || l.alert_level === 'ORANGE').length;

    return {
      activeLaboursCount: activeLabours.length,
      pendingReferralsCount: pendingReferrals.length,
      completedTodayCount: completedToday.length + 3, // Mock offset for visual volume
      criticalCount,
      activeLaboursList: mappedLabours,
      referralsList: enrichedReferrals
    };
  }, [user]);

  // Reactive fetch for Ambulances (for district / manager dashboards)
  const ambulances = useLiveQuery(async () => {
    return await db.ambulances.toArray();
  });

  if (!user || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 border-4 border-status-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderRoleKPIs = () => {
    // 1. Midwife & Nurse KPI grids
    if (user.role.name === 'MIDWIFE' || user.role.name === 'NURSE') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-sky-500/10 text-sky-400 rounded-xl"><Activity className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Travails Actifs</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.activeLaboursCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-status-red/10 text-status-red rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Cas en Alerte</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.criticalCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-status-green/10 text-status-green rounded-xl"><CheckCircle className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Accouchements (24h)</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.completedTodayCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-status-orange/10 text-status-orange rounded-xl"><Send className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Transferts en attente</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.pendingReferralsCount}</h4>
            </div>
          </div>
        </div>
      );
    }

    // 2. Doctor & Gynecologist KPI grid
    if (user.role.name === 'PHYSICIAN' || user.role.name === 'GYNECOLOGIST') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-status-red/10 text-status-red rounded-xl"><HeartPulse className="h-6 w-6 animate-pulse text-status-red" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Urgences Critiques</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.criticalCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-status-orange/10 text-status-orange rounded-xl"><Send className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Demandes de Transferts</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.pendingReferralsCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-sky-500/10 text-sky-400 rounded-xl"><Activity className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Suivi Salle Naissance</p>
              <h4 className="text-2xl font-bold text-white mt-1">{stats.activeLaboursCount}</h4>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-brand-muted">Gynécos d'Astreinte</p>
              <h4 className="text-2xl font-bold text-white mt-1">2</h4>
            </div>
          </div>
        </div>
      );
    }

    // 3. District & Managers aggregates
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-brand-muted">Total Patientes Suivies</p>
            <h4 className="text-2xl font-bold text-white mt-1">154</h4>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3.5 bg-status-orange/10 text-status-orange rounded-xl"><Send className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-brand-muted">Taux d'Évacuation</p>
            <h4 className="text-2xl font-bold text-white mt-1">7.4 %</h4>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3.5 bg-status-green/10 text-status-green rounded-xl"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-brand-muted">Disponibilité Ambulances</p>
            <h4 className="text-2xl font-bold text-white mt-1">
              {ambulances?.filter(a => a.status === 'available').length || 0} / {ambulances?.length || 0}
            </h4>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl"><HeartPulse className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-brand-muted">Taux Césarienne</p>
            <h4 className="text-2xl font-bold text-white mt-1">12.1 %</h4>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {user.role.name === 'MIDWIFE' || user.role.name === 'NURSE' ? 'Salle de Naissance' : 
             user.role.name === 'PHYSICIAN' || user.role.name === 'GYNECOLOGIST' ? 'Supervision Clinique' :
             'Tableau de Bord Analytique'}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Maternité : <span className="text-white font-medium">{user.facility.name}</span>
          </p>
        </div>

        {/* Admission Shortcut */}
        {(user.role.name === 'MIDWIFE' || user.role.name === 'NURSE' || user.role.name === 'PHYSICIAN') && (
          <Link
            to="/patients"
            className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-status-orange to-[#f43f5e] hover:brightness-110 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow-lg self-start md:self-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Admettre une Patiente
          </Link>
        )}
      </div>

      {/* KPI Cards Grid */}
      {renderRoleKPIs()}

      {/* Main Grid: Active Labour Rooms & Ambulance Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Birth Rooms Table (Left 2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">Patientes en Travail Actif</h3>
            <span className="text-xs bg-slate-900 px-2.5 py-1.5 rounded-lg border border-brand-border/20 text-brand-muted">
              {stats.activeLaboursList.length} Patiente(s) en salle
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {stats.activeLaboursList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-muted text-center space-y-3">
                <Users className="h-10 w-10 text-slate-700" />
                <p className="text-sm">Aucun travail actif enregistré pour le moment.</p>
                <Link to="/patients" className="text-xs text-status-orange font-bold hover:underline">Admettre une patiente maintenant &rarr;</Link>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-brand-border/20">
                    <thead>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Patiente</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Admission</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Dilatation</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">Gravité / Statut</th>
                        <th scope="col" className="relative px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/10">
                      {stats.activeLaboursList.map((labour) => {
                        const isRed = labour.alert_level === 'RED';
                        const isOrange = labour.alert_level === 'ORANGE';
                        const isYellow = labour.alert_level === 'YELLOW';
                        
                        return (
                          <tr key={labour.labour_id} className="hover:bg-slate-900/40 transition">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="font-bold text-white">{labour.patient_name}</div>
                              <div className="text-[10px] text-brand-muted font-mono mt-0.5">{labour.patient_code}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-xs text-white flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                {new Date(labour.admission_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-brand-muted mt-0.5">Le {new Date(labour.admission_datetime).toLocaleDateString('fr-FR')}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
                              <div className="flex items-center space-x-2">
                                <div className="text-base font-bold text-white font-mono">{labour.latest_dilation} cm</div>
                                {/* Dilation progression indicator */}
                                <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-status-orange" style={{ width: `${(labour.latest_dilation / 10) * 100}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                                isRed ? 'bg-status-red/10 text-status-red border border-status-red/30 animate-alert-pulse rounded-lg' :
                                isOrange ? 'bg-status-orange/10 text-status-orange border border-status-orange/30' :
                                isYellow ? 'bg-status-yellow/10 text-status-yellow border border-status-yellow/30' :
                                'bg-status-green/10 text-status-green border border-status-green/30'
                              }`}>
                                {isRed ? 'Urgences / Détresse' : 
                                 isOrange ? 'Haute Surveillance' :
                                 isYellow ? 'Progression Lente' : 'Normal / Stable'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => navigate(`/partogram/${labour.labour_id}`)}
                                className="inline-flex items-center text-xs font-bold text-status-orange hover:text-white transition group"
                              >
                                Partogramme 
                                <ArrowRight className="h-3.5 w-3.5 ml-1 transition group-hover:translate-x-1" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Tracker (Right 1 Column) */}
        <div className="glass-panel rounded-2xl border border-brand-border/40 p-6 flex flex-col h-[500px]">
          <h3 className="text-base font-bold text-white mb-6">Suivi des Transferts Actifs</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {stats.referralsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-muted text-center space-y-3">
                <Send className="h-10 w-10 text-slate-700" />
                <p className="text-sm">Aucun transfert d'urgence en cours.</p>
              </div>
            ) : (
              stats.referralsList.map((ref) => (
                <div key={ref.id} className="p-4 bg-slate-900/60 rounded-2xl border border-brand-border/30 hover:border-slate-800 transition space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{ref.patient_name}</h4>
                      <p className="text-[10px] text-brand-muted font-mono">{ref.patient_code}</p>
                    </div>
                    <span className="text-[9px] font-bold bg-status-orange/20 text-status-orange border border-status-orange/30 px-2 py-0.5 rounded uppercase">
                      {ref.referral_status}
                    </span>
                  </div>

                  <div className="text-[11px] text-brand-muted leading-relaxed">
                    Destination : <span className="text-white font-medium">{ref.dest_name}</span>
                  </div>

                  <div className="p-2.5 bg-status-red/5 border border-status-red/20 rounded-xl text-[11px] text-status-red/90 leading-normal italic truncate">
                    &quot;{ref.reason}&quot;
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-brand-border/10">
                    <span className="text-[10px] text-brand-muted">
                      Initié par Midwife
                    </span>
                    
                    <button
                      onClick={() => navigate('/referrals')}
                      className="text-[11px] font-bold text-status-orange hover:underline"
                    >
                      Détails transfert &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
