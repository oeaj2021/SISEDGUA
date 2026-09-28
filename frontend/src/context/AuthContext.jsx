import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('sisedgua_token');
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('sisedgua_token');
      localStorage.removeItem('sisedgua_nombre');
      localStorage.removeItem('sisedgua_email');
      return null;
    }
    const nombre = localStorage.getItem('sisedgua_nombre');
    const email = localStorage.getItem('sisedgua_email');
    return { token, nombre, email };
  });

  const navigate = useNavigate();

  const loginAdmin = useCallback((token, nombre, email, redirectTo = '/dashboard') => {
    localStorage.setItem('sisedgua_token', token);
    localStorage.setItem('sisedgua_nombre', nombre);
    localStorage.setItem('sisedgua_email', email || '');
    setAdmin({ token, nombre, email });
    navigate(redirectTo);
  }, [navigate]);

  const logout = useCallback((redirectTo = '/login') => {
    localStorage.removeItem('sisedgua_token');
    localStorage.removeItem('sisedgua_nombre');
    localStorage.removeItem('sisedgua_email');
    setAdmin(null);
    navigate(redirectTo);
  }, [navigate]);

  useEffect(() => {
    const checkExpiration = () => {
      const token = localStorage.getItem('sisedgua_token');
      if (token && isTokenExpired(token)) {
        const currentPath = window.location.pathname + window.location.search;
        logout(`/login?redirect=${encodeURIComponent(currentPath)}&expired=true`);
      }
    };

    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ admin, loginAdmin, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

