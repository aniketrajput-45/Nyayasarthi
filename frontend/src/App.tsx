import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No Layout here, so NO Chatbot will appear */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - These are wrapped in Layout, so the Chatbot WILL appear */}
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

          {/* Fallback Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
