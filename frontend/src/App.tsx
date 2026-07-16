import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { PartogramPage } from './pages/PartogramPage';
import { ReferralPage } from './pages/ReferralPage';
import { StatsPage } from './pages/StatsPage';
import { AdminPage } from './pages/AdminPage';

// Guard wrapper to check for authenticated sessions
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="h-10 w-10 border-4 border-status-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based protection route wrapper
const RoleProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="h-10 w-10 border-4 border-status-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role.name)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
        <Routes>
          {/* Public Authentication page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Clinical Dashboard pages */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={
              <RoleProtectedRoute allowedRoles={['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <DashboardPage />
              </RoleProtectedRoute>
            } />
            <Route path="patients" element={
              <RoleProtectedRoute allowedRoles={['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <PatientProfilePage />
              </RoleProtectedRoute>
            } />
            <Route path="partogram/:labourId" element={
              <RoleProtectedRoute allowedRoles={['MIDWIFE', 'NURSE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <PartogramPage />
              </RoleProtectedRoute>
            } />
            <Route path="referrals" element={
              <RoleProtectedRoute allowedRoles={['MIDWIFE', 'PHYSICIAN', 'GYNECOLOGIST', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <ReferralPage />
              </RoleProtectedRoute>
            } />
            <Route path="stats" element={
              <RoleProtectedRoute allowedRoles={['MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <StatsPage />
              </RoleProtectedRoute>
            } />
            <Route path="admin" element={
              <RoleProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'MATERNITY_MANAGER', 'DISTRICT_ADMIN']}>
                <AdminPage />
              </RoleProtectedRoute>
            } />
          </Route>

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};
