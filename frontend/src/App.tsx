import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FileCase } from './pages/FileCase';
import { Cases } from './pages/Cases';
import { Chat } from './pages/Chat';
import { Analytics } from './pages/Analytics';
import { Chatbot } from './components/Chatbot';

function App() {
  return (
    <Router>
      <AuthProvider>
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
            <Route path="/my-cases" element={<Cases />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Chatbot />
      </AuthProvider>
    </Router>
  );
}

export default App;
