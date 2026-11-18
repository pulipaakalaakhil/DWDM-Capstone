import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import OverviewDashboard from './pages/OverviewDashboard';
import LiveTraffic from './pages/LiveTraffic';
import Map3D from './pages/Map3D';
import TrafficPatternAnalysis from './pages/TrafficPatternAnalysis';
import DataExploration from './pages/DataExploration';
import DataPreprocessing from './pages/DataPreprocessing';
import DataMining from './pages/DataMining';
import MLPrediction from './pages/MLPrediction';
import HotspotDetection from './pages/HotspotDetection';
import OLAPCube from './pages/OLAPCube';
import DatabaseArchitecture from './pages/DatabaseArchitecture';
import NormalizedSchema from './pages/NormalizedSchema';
import StarSchema from './pages/StarSchema';
import SnowflakeSchema from './pages/SnowflakeSchema';
import OLAPAnalytics from './pages/OLAPAnalytics';
import BIAnalytics from './pages/BIAnalytics';
import Reports from './pages/Reports';
import About from './pages/About';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Login & 2FA Page */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Main Application with Sidebar & Header */}
            <Route
              path="/*"
              element={
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<OverviewDashboard />} />
                    <Route path="/live" element={<LiveTraffic />} />
                    <Route path="/map-3d" element={<Map3D />} />
                    <Route path="/patterns" element={<TrafficPatternAnalysis />} />
                    <Route path="/db-architecture" element={<DatabaseArchitecture />} />
                    <Route path="/normalized-schema" element={<NormalizedSchema />} />
                    <Route path="/star-schema" element={<StarSchema />} />
                    <Route path="/snowflake-schema" element={<SnowflakeSchema />} />
                    <Route path="/olap-cube" element={<OLAPCube />} />
                    <Route path="/olap-analytics" element={<OLAPAnalytics />} />
                    <Route path="/exploration" element={<DataExploration />} />
                    <Route path="/preprocessing" element={<DataPreprocessing />} />
                    <Route path="/mining" element={<DataMining />} />
                    <Route path="/ml-prediction" element={<MLPrediction />} />
                    <Route path="/hotspots" element={<HotspotDetection />} />
                    <Route path="/bi-analytics" element={<BIAnalytics />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
