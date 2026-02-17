import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FileCase } from './pages/FileCase';
import { LegalNotice } from './pages/LegalNotice';
import { Cases } from './pages/Cases';
import { Chat } from './pages/Chat';
import { Analytics } from './pages/Analytics';
import { CaseDetails } from './pages/CaseDetails';
// Note: Chatbot import is removed from here

function AppContent() {
  const location = useLocation();
  const hideChatbot = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/file-case" element={<FileCase />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/my-cases" element={<Cases />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/case/:id" element={<CaseDetails />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {!hideChatbot && <Chatbot />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
