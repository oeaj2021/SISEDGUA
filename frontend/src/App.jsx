import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import FormManana from './pages/FormManana';
import FormTarde from './pages/FormTarde';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function RutaProtegida({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/manana" replace />} />
      <Route path="/manana" element={<FormManana />} />
      <Route path="/tarde" element={<FormTarde />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/manana" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
