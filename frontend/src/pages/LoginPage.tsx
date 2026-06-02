import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Activity, ShieldAlert, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = t('login_title');
  }, [language, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('email_required'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email);
      navigate('/');
    } catch (err: any) {
      if (err.message === "Identifiants incorrects ou compte inexistant.") {
        setError(t('auth_error'));
      } else {
        setError(err.message || t('auth_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(quickEmail);
      navigate('/');
    } catch (err: any) {
      if (err.message === "Identifiants incorrects ou compte inexistant.") {
        setError(t('auth_error'));
      } else {
        setError(err.message || t('auth_failed'));
      }
      setLoading(false);
    }
  };

  const quickRoles = [
    { label: t('role_midwife'), email: 'sagefemme@partocare.cm', color: 'border-emerald-500/20 hover:border-emerald-500/50' },
    { label: t('role_nurse'), email: 'infirmier@partocare.cm', color: 'border-cyan-500/20 hover:border-cyan-500/50' },
    { label: t('role_physician'), email: 'medecin@partocare.cm', color: 'border-amber-500/20 hover:border-amber-500/50' },
    { label: t('role_gynecologist'), email: 'gynecologue@partocare.cm', color: 'border-rose-500/20 hover:border-rose-500/50' },
    { label: t('role_manager'), email: 'responsable@partocare.cm', color: 'border-indigo-500/20 hover:border-indigo-500/50' },
    { label: t('role_district'), email: 'district@partocare.cm', color: 'border-orange-500/20 hover:border-orange-500/50' },
    { label: t('role_admin'), email: 'admin@partocare.cm', color: 'border-slate-500/20 hover:border-slate-500/50' }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 py-12 sm:px-6 lg:px-8 overflow-hidden font-sans">
      
      {/* Language Toggle in Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/50 border border-brand-border/20 p-1 rounded-lg">
        <button 
          onClick={() => setLanguage('fr')}
          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition-all duration-150 ${
            language === 'fr' 
              ? 'bg-gradient-to-tr from-status-red/10 to-status-orange/20 text-status-orange border border-status-orange/20 shadow-inner' 
              : 'text-brand-muted hover:text-white'
          }`}
        >
          FR
        </button>
        <button 
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition-all duration-150 ${
            language === 'en' 
              ? 'bg-gradient-to-tr from-status-red/10 to-status-orange/20 text-status-orange border border-status-orange/20 shadow-inner' 
              : 'text-brand-muted hover:text-white'
          }`}
        >
          EN
        </button>
      </div>

      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-status-red/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-status-orange/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 z-10">
        
        {/* Brand Banner */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-status-red to-status-orange flex items-center justify-center shadow-xl">
            <Activity className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PartoCare
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            {t('login_subtitle')}
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-brand-border/40">
          
          {error && (
            <div className="mb-4 p-3.5 bg-status-red/10 border border-status-red/30 rounded-xl flex items-center space-x-2.5">
              <ShieldAlert className="h-5 w-5 text-status-red shrink-0" />
              <span className="text-xs font-medium text-status-red">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'fr' ? 'ex: sagefemme@partocare.cm' : 'ex: midwife@partocare.cm'}
                className="w-full px-4 py-3 bg-[#070b13] border border-brand-border/55 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-status-orange focus:ring-1 focus:ring-status-orange transition duration-150 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#070b13] border border-brand-border/55 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-status-orange focus:ring-1 focus:ring-status-orange transition duration-150 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-status-orange to-[#f43f5e] hover:brightness-110 active:brightness-95 text-white font-bold rounded-xl text-sm transition focus:outline-none shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('sign_in')}
                </>
              )}
            </button>
          </form>

          {/* Quick simulation cards */}
          <div className="mt-8 pt-6 border-t border-brand-border/20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {t('demo_accounts')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickRoles.map((role) => (
                <button
                  key={role.email}
                  onClick={() => handleQuickLogin(role.email)}
                  disabled={loading}
                  className={`text-left p-2.5 bg-[#0e1423] border ${role.color} rounded-xl text-xs transition duration-150 flex flex-col justify-between group disabled:opacity-50`}
                >
                  <span className="font-semibold text-white group-hover:text-status-orange transition truncate">{role.label}</span>
                  <span className="text-[10px] text-brand-muted truncate">{role.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Offline indicator footer notice */}
        <div className="text-center text-xs text-brand-muted leading-relaxed">
          {t('oms_notice')}<br />
          {t('offline_notice')}
        </div>
      </div>
    </div>
  );
};
