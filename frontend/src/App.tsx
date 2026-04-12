import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { Landing } from './pages/Landing';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Public Root Route - Professional Landing Page */}
          <Route path="/" element={<Landing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Wrapped in Layout and ProtectedRoute */}
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

          {/* Fallback Route - Redirects unknown paths to the Landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;