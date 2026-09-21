import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('sisedgua_token');
    const nombre = localStorage.getItem('sisedgua_nombre');
    const email = localStorage.getItem('sisedgua_email');
    return token ? { token, nombre, email } : null;
  });

  const navigate = useNavigate();

  const loginAdmin = useCallback((token, nombre, email) => {
    localStorage.setItem('sisedgua_token', token);
    localStorage.setItem('sisedgua_nombre', nombre);
    localStorage.setItem('sisedgua_email', email || '');
    setAdmin({ token, nombre, email });
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('sisedgua_token');
    localStorage.removeItem('sisedgua_nombre');
    localStorage.removeItem('sisedgua_email');
    setAdmin(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ admin, loginAdmin, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
