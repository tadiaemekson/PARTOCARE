import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { syncManager } from '../services/sync';
import { db } from '../services/db';
import { 
  Activity, Users, Send, BarChart2, Settings, LogOut, 
  Menu, X, Bell, RefreshCw, AlertTriangle, User
} from 'lucide-react';
import { ChatBot } from '../components/ChatBot';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';

export const DashboardLayout: React.FC = () => {
  const { user, logout, updateSessionUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(syncManager.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);

  // Profile modal settings state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const handleOpenProfileModal = () => {
    if (!user) return;
    setProfileFirstName(user.first_name);
    setProfileLastName(user.last_name);
    setProfileEmail(user.email);
    db.users.get(user.id).then(u => {
      setProfilePhone(u?.phone || '');
    });
    setProfilePassword('');
    setProfileSuccessMsg(null);
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileFirstName.trim() || !profileLastName.trim() || !profileEmail.trim()) {
      alert("Le prénom, le nom et l'adresse email sont requis.");
      return;
    }

    try {
      const updates: any = {
        first_name: profileFirstName,
        last_name: profileLastName,
        email: profileEmail,
        phone: profilePhone
      };
      if (profilePassword.trim()) {
        updates.password = profilePassword;
      }

      await apiService.updateUser(user.id, updates);

      updateSessionUser({
        first_name: profileFirstName,
        last_name: profileLastName,
        email: profileEmail
      });

      setProfileSuccessMsg("Profil mis à jour avec succès.");
      setTimeout(() => {
        setProfileSuccessMsg(null);
        setShowProfileModal(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Erreur de mise à jour du profil.");
    }
  };

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

  const menuItems = [
    { name: t('dashboard'), path: '/', icon: Activity, roles: ['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'SYSTEM_ADMIN', 'DISTRICT_ADMIN'] },
    { name: t('patients'), path: '/patients', icon: Users, roles: ['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER'] },
    { name: t('referrals'), path: '/referrals', icon: Send, iconColor: 'text-status-orange', roles: ['MIDWIFE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN'] },
    { name: t('reports'), path: '/stats', icon: BarChart2, roles: ['MATERNITY_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN'] },
    { name: t('admin'), path: '/admin', icon: Settings, roles: ['SYSTEM_ADMIN', 'MATERNITY_MANAGER'] }
  ].filter(item => user && item.roles.includes(user.role.name));

  const hasCriticalAlerts = activeAlerts.some(a => a.alert_level === 'RED');

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. SIDEBAR Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b0f19]/95 border-r border-brand-border/30 flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo and title */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border/30 bg-[#070b13]/40">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="PartoCare Logo" className="h-8 object-contain" />
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              PartoCare
            </span>
          </Link>
          <button className="md:hidden p-1.5 text-brand-muted hover:text-white rounded-lg" onClick={() => setMobileMenuOpen(false)}>
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

        {/* User Section */}
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
                
                {/* Badge displaying Role and Edit Profile Shortcut */}
                <div className="flex justify-between items-center mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                    user.role.name === 'MIDWIFE' ? 'bg-emerald-500/10 text-emerald-400' :
                    user.role.name === 'PHYSICIAN' ? 'bg-amber-500/10 text-amber-400' :
                    user.role.name === 'GYNECOLOGIST' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {user.role.name}
                  </span>
                  <button 
                    onClick={() => handleOpenProfileModal()}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-bold transition flex items-center space-x-1"
                  >
                    <User className="h-3 w-3" />
                    <span>Profil</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN Frame */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
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
            
            {/* Language Selector */}
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

            {/* Mon Profil Shortcut */}
            <button
              onClick={() => handleOpenProfileModal()}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-brand-border/30 text-xs text-brand-muted hover:text-white hover:bg-slate-800 transition animate-pulse-slow"
              title="Mon Profil"
            >
              <User className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Mon Profil</span>
            </button>

            {/* Offline & Outbox Sync Indicator */}
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-brand-border/20 px-3 py-1.5 rounded-lg">
              <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-status-green animate-pulse' : 'bg-status-red'}`} />
              <span className="text-[10px] font-bold hidden sm:inline text-brand-muted">
                {isOnline ? t('online') : t('offline')}
              </span>
              
              {pendingSyncCount > 0 && isOnline && (
                <button 
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="ml-2 flex items-center space-x-1.5 px-2 py-0.5 bg-status-orange/10 border border-status-orange/30 text-status-orange rounded text-[9px] font-black hover:brightness-110 active:scale-95 transition"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync ({pendingSyncCount})</span>
                </button>
              )}
            </div>

            {/* Alerts Center Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowAlertDropdown(!showAlertDropdown)}
                className={`p-2 rounded-lg border transition relative ${
                  hasCriticalAlerts 
                    ? 'bg-status-red/10 border-status-red/40 hover:bg-status-red/20 text-status-red animate-pulse' 
                    : 'border-brand-border/30 text-brand-muted hover:text-white hover:bg-slate-800'
                }`}
              >
                <Bell className="h-5 w-5" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-status-red text-[9px] font-extrabold text-white ring-2 ring-[#070b13]">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {showAlertDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl glass-panel shadow-2xl py-1 z-50 border border-brand-border/50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-brand-border/20 text-xs font-bold text-slate-300 flex justify-between">
                    <span>Alertes Actives</span>
                    <span className="text-status-red">({activeAlerts.length})</span>
                  </div>
                  {activeAlerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-brand-muted">Aucune alerte active</div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        onClick={() => { setShowAlertDropdown(false); navigate(`/partogram/${alert.labour_id}`); }}
                        className="px-4 py-3 hover:bg-slate-800/40 border-b border-brand-border/10 last:border-b-0 cursor-pointer transition flex items-start space-x-2.5"
                      >
                        <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${alert.alert_level === 'RED' ? 'text-status-red' : 'text-status-orange'}`} />
                        <div className="min-w-0">
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

      {/* User Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-brand-border/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-left">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border/10">
              <h3 className="text-sm font-bold text-white flex items-center">
                <User className="h-5 w-5 text-status-orange mr-2" />
                Paramètres de Mon Profil
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-brand-muted hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-status-green/10 border border-status-green/20 text-status-green rounded-xl font-bold">
                {profileSuccessMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Prénom *</label>
                  <input 
                    type="text" 
                    value={profileFirstName}
                    onChange={e => setProfileFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Nom *</label>
                  <input 
                    type="text" 
                    value={profileLastName}
                    onChange={e => setProfileLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Adresse Email *</label>
                <input 
                  type="email" 
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-bold" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Numéro de téléphone</label>
                <input 
                  type="text" 
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-muted mb-1.5">Changer le mot de passe (laisser vide si inchangé)</label>
                <input 
                  type="password" 
                  value={profilePassword}
                  onChange={e => setProfilePassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full px-3 py-2 bg-[#070b13] border border-brand-border/40 rounded-lg text-white font-mono" 
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-brand-border/40 hover:bg-slate-800 rounded-xl text-white font-bold transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-tr from-status-red to-status-orange hover:brightness-110 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
