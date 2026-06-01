import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

export const App: React.FC = () => {
  return (
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
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientProfilePage />} />
            <Route path="partogram/:labourId" element={<PartogramPage />} />
            <Route path="referrals" element={<ReferralPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};
