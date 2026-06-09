import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SoundscapeProvider } from './context/SoundscapeContext';

// Components
import Sidebar from './components/Sidebar';
import SoundscapeController from './components/SoundscapeController';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Quizzes from './pages/Quizzes';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Leaderboard from './pages/Leaderboard';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-textMuted text-sm tracking-wide">
        Loading Studyverse Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout wrapper for pages requiring Sidebar
const AppLayout = ({ children }) => {
  return (
    <div className="flex bg-brand-bg min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
};

// Global Soundscape controller visibility wrapper
const SoundscapeWidgetWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <SoundscapeController />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <SoundscapeProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes wrapped in AppLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Notes />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Quizzes />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Rooms />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms/:code"
                element={
                  <ProtectedRoute>
                    {/* Note: We do NOT use sidebar layout inside study rooms for a distraction-free experience */}
                    <RoomDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Leaderboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SoundscapeWidgetWrapper />
          </SoundscapeProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
