import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import './styles/globals.css';

// Auth Pages
import Login from './app/auth/login';
import Register from './app/auth/register';
import Anonymous from './app/auth/anonymous';
import Onboarding from './app/auth/onboarding';

// Core Pages
import Home from './app/index';
import Calendar from './app/calendar';
import DailyLog from './app/log/[date]';
import CycleInsights from './app/cycle/insights';
import CycleHistory from './app/cycle/history';

// Ovulation Pages
import OvulationForecast from './app/ovulation/forecast';
import BBTChart from './app/ovulation/bbt-chart';
import OvulationTests from './app/ovulation/tests';

// Pregnancy Pages
import PregnancyDashboard from './app/pregnacy/dashboard';
import PregnancyWeek from './app/pregnacy/week/[week]';

// Symptoms & Insights
import Symptoms from './app/symptoms';
import Insights from './app/insights';
import ArticlePage from './app/insights/article/[id]';

// Profile Pages
import Profile from './app/profile';
import CycleSettings from './app/profile/cycle-settings';
import Notifications from './app/profile/notifications';
import Privacy from './app/profile/privacy';
import DataExport from './app/profile/data-export';
import Theme from './app/profile/theme';

// Community Pages
import Community from './app/community';

// Utility Pages
import Offline from './app/offline';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/auth/login" />;
};

// Public Route Component (for logged-out users)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/" />;
};

function App() {
  // Initialize theme on app load
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    const highContrast = localStorage.getItem('highContrast') === 'true';
    const compactView = localStorage.getItem('compactView') === 'true';
    
    // Apply saved preferences
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    if (compactView) {
      document.documentElement.classList.add('compact-view');
    }
    
    // Check for PWA installation
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js');
      });
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/auth/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/auth/anonymous" element={
            <PublicRoute>
              <Anonymous />
            </PublicRoute>
          } />
          <Route path="/auth/onboarding" element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          } />

          {/* Main App Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout><Home /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/calendar" element={
            <PrivateRoute>
              <Layout><Calendar /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/log/:date" element={
            <PrivateRoute>
              <Layout><DailyLog /></Layout>
            </PrivateRoute>
          } />

          {/* Cycle Routes */}
          <Route path="/cycle/insights" element={
            <PrivateRoute>
              <Layout><CycleInsights /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/cycle/history" element={
            <PrivateRoute>
              <Layout><CycleHistory /></Layout>
            </PrivateRoute>
          } />

          {/* Ovulation Routes */}
          <Route path="/ovulation/forecast" element={
            <PrivateRoute>
              <Layout><OvulationForecast /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/ovulation/bbt-chart" element={
            <PrivateRoute>
              <Layout><BBTChart /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/ovulation/tests" element={
            <PrivateRoute>
              <Layout><OvulationTests /></Layout>
            </PrivateRoute>
          } />

          {/* Pregnancy Routes */}
          <Route path="/pregnancy/dashboard" element={
            <PrivateRoute>
              <Layout><PregnancyDashboard /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/pregnancy/week/:week" element={
            <PrivateRoute>
              <Layout><PregnancyWeek /></Layout>
            </PrivateRoute>
          } />

          {/* Symptoms & Insights */}
          <Route path="/symptoms" element={
            <PrivateRoute>
              <Layout><Symptoms /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/insights" element={
            <PrivateRoute>
              <Layout><Insights /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/insights/article/:id" element={
            <PrivateRoute>
              <Layout><ArticlePage /></Layout>
            </PrivateRoute>
          } />

          {/* Profile Routes */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout><Profile /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile/cycle-settings" element={
            <PrivateRoute>
              <Layout><CycleSettings /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile/notifications" element={
            <PrivateRoute>
              <Layout><Notifications /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile/privacy" element={
            <PrivateRoute>
              <Layout><Privacy /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile/data-export" element={
            <PrivateRoute>
              <Layout><DataExport /></Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile/theme" element={
            <PrivateRoute>
              <Layout><Theme /></Layout>
            </PrivateRoute>
          } />

          {/* Community Routes */}
          <Route path="/community" element={
            <PrivateRoute>
              <Layout><Community /></Layout>
            </PrivateRoute>
          } />

          {/* Utility Routes */}
          <Route path="/offline" element={<Offline />} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;