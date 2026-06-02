import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { syncManager } from '../services/sync';
import { db } from '../services/db';
import { 
  Activity, Users, Send, BarChart2, Settings, LogOut, 
  Menu, X, Bell, Wifi, WifiOff, RefreshCw, AlertTriangle, UserCheck
} from 'lucide-react';
import { ChatBot } from '../components/ChatBot';
import { useLanguage } from '../contexts/LanguageContext';

export const DashboardLayout: React.FC = () => {
  const { user, logout, login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(syncManager.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Sync state tracking
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((online, count) => {
      setIsOnline(online);
      setPendingSyncCount(count);
    });
    return () => unsubscribe();
  }, []);

  // Fetch active alerts in the facility
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      const allAlerts = await db.alerts.toArray();
      const activeCases = allAlerts.filter(a => !a.resolved_at);
      
      const enrichedAlerts = await Promise.all(
        activeCases.map(async (alert) => {
          const labour = await db.labours.get(alert.labour_id);
          const preg = labour ? await db.pregnancies.get(labour.pregnancy_id) : null;
          const patient = preg ? await db.patients.get(preg.patient_id) : null;
          return {
            ...alert,
            patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patiente'
          };
        })
      );
      
      // Sort: RED alerts first
      enrichedAlerts.sort((a, b) => (b.alert_level === 'RED' ? 1 : 0) - (a.alert_level === 'RED' ? 1 : 0));
      setActiveAlerts(enrichedAlerts);
    };

    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 5000); // Poll local DB alerts
    return () => clearInterval(interval);
  }, []);

  const handleSyncClick = async () => {
    if (pendingSyncCount === 0 || !isOnline) return;
    setIsSyncing(true);
    await syncManager.syncOutbox();
    setIsSyncing(false);
  };

  const handleRoleChange = async (roleEmail: string) => {
    try {
      await login(roleEmail);
      setShowRoleDropdown(false);
      navigate('/');
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const menuItems = [
    { name: t('dashboard'), path: '/', icon: Activity, roles: ['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'SYSTEM_ADMIN', 'DISTRICT_ADMIN'] },
    { name: t('patients'), path: '/patients', icon: Users, roles: ['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER'] },
    { name: t('referrals'), path: '/referrals', icon: Send, iconColor: 'text-status-orange', roles: ['MIDWIFE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN'] },
    { name: t('reports'), path: '/stats', icon: BarChart2, roles: ['MATERNITY_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN'] },
    { name: t('admin'), path: '/admin', icon: Settings, roles: ['SYSTEM_ADMIN'] }
  ].filter(item => user && item.roles.includes(user.role.name));

  const hasCriticalAlerts = activeAlerts.some(a => a.alert_level === 'RED');

  return (
    <div className="flex h-screen bg-[#0b0f19] text-[#f8fafc] overflow-hidden font-sans">
      {/* 1. SIDEBAR Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 hidden md:block'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border/30">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-status-red to-status-orange rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PartoCare
              </span>
            </Link>
            <button className="md:hidden text-brand-muted hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-l-4 border-status-orange text-white shadow-inner' 
                      : 'text-brand-muted hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-status-orange' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section / Quick Role Selector */}
          <div className="p-4 border-t border-brand-border/30">
            {user && (
              <div className="relative">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-brand-border/20 flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-brand-border/40 text-sm font-bold text-status-orange">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{user.first_name} {user.last_name}</p>
                      <p className="text-xs truncate text-brand-muted">{user.facility.name}</p>
                    </div>
                  </div>
                  
                  {/* Badge displaying Role */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold self-start ${
                    user.role.name === 'MIDWIFE' ? 'bg-emerald-500/10 text-emerald-400' :
                    user.role.name === 'PHYSICIAN' ? 'bg-amber-500/10 text-amber-400' :
                    user.role.name === 'GYNECOLOGIST' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {user.role.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-brand-border/30 bg-[#0b0f19]/80 backdrop-blur-md z-30">
          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-brand-muted hover:text-white rounded-lg" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden md:block">
            <span className="text-sm font-medium text-brand-muted">
              PartoCare &bull; {t('connected_maternity')}
            </span>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center space-x-4">
            
            {/* Language Selector (Bilingual Toggle) */}
            <div className="flex items-center bg-slate-900/50 border border-brand-border/20 p-1 rounded-lg">
              <button 
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all duration-150 ${
                  language === 'fr' 
                    ? 'bg-gradient-to-tr from-status-red/10 to-status-orange/20 text-status-orange border border-status-orange/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                FR
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all duration-150 ${
                  language === 'en' 
                    ? 'bg-gradient-to-tr from-status-red/10 to-status-orange/20 text-status-orange border border-status-orange/20 shadow-inner' 
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-brand-border/40 text-xs text-brand-muted hover:text-white hover:bg-slate-800 transition"
                title="Changer de rôle clinique (Demo)"
              >
                <UserCheck className="h-4 w-4 text-status-orange" />
                <span className="hidden sm:inline">Rôle Démo</span>
              </button>
              
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel shadow-2xl py-1 z-50 border border-brand-border/50">
                  <div className="px-4 py-2 border-b border-brand-border/20 text-xs font-semibold text-status-orange">
                    Simuler un personnel :
                  </div>
                  {[
                    { label: 'Sage-femme (Ndiki)', email: 'sagefemme@partocare.cm' },
                    { label: 'Médecin Généraliste (Ndiki)', email: 'medecin@partocare.cm' },
                    { label: 'Gynécologue (Hôp. Bafia)', email: 'gynecologue@partocare.cm' },
                    { label: 'Maternity Manager (Ndiki)', email: 'responsable@partocare.cm' },
                    { label: 'District Admin (Bafia)', email: 'district@partocare.cm' },
                    { label: 'Admin Système', email: 'admin@partocare.cm' }
                  ].map(r => (
                    <button
                      key={r.email}
                      onClick={() => handleRoleChange(r.email)}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition ${user?.email === r.email ? 'text-status-orange font-bold' : 'text-slate-300'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offline & Outbox Sync Indicator */}
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-brand-border/20 px-3 py-1.5 rounded-lg">
              {isOnline ? (
                <span title="Appareil en ligne"><Wifi className="h-4 w-4 text-status-green" /></span>
              ) : (
                <span title="Hors-ligne - Données sauvegardées localement"><WifiOff className="h-4 w-4 text-status-yellow animate-pulse" /></span>
              )}
              
              {pendingSyncCount > 0 && (
                <button
                  onClick={handleSyncClick}
                  disabled={isSyncing || !isOnline}
                  className="flex items-center space-x-1 text-xs font-medium text-status-orange hover:brightness-110"
                  title={`${pendingSyncCount} modifications en attente de synchronisation.`}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync ({pendingSyncCount})</span>
                </button>
              )}
            </div>

            {/* Clinical Alert Notification Hub */}
            <div className="relative">
              <button 
                onClick={() => setShowAlertDropdown(!showAlertDropdown)}
                className={`p-2 rounded-lg relative ${hasCriticalAlerts ? 'bg-status-red/10 border border-status-red/30' : 'bg-slate-950/60 border border-brand-border/20'}`}
              >
                <Bell className={`h-5 w-5 ${hasCriticalAlerts ? 'text-status-red animate-alert-pulse rounded-full' : 'text-brand-muted'}`} />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-status-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {showAlertDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel shadow-2xl py-1 z-50 border border-brand-border/50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-brand-border/20 flex justify-between items-center text-xs font-bold text-brand-text">
                    <span>Alertes Maternité Actives</span>
                    <span className="bg-status-red/20 text-status-red px-1.5 py-0.5 rounded text-[10px]">{activeAlerts.length}</span>
                  </div>
                  {activeAlerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-brand-muted">Aucune alerte active à signaler.</div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div key={alert.id} className="p-3 border-b border-brand-border/10 flex items-start space-x-2.5 hover:bg-slate-900/60 transition">
                        <AlertTriangle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${alert.alert_level === 'RED' ? 'text-status-red' : 'text-status-orange'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{alert.patient_name}</p>
                          <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">{alert.alert_message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 bg-slate-950/60 border border-brand-border/20 rounded-lg hover:text-status-red transition"
              title="Se déconnecter"
            >
              <LogOut className="h-5 w-5 text-brand-muted hover:text-status-red" />
            </button>
          </div>
        </header>

        {/* 3. Main Outlet Container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950/20 p-6">
          <Outlet />
        </main>
        
        {/* Floating Interactive Chat Assistant */}
        <ChatBot />
      </div>
    </div>
  );
};
