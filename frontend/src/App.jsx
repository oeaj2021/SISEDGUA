import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import FormManana from './pages/FormManana';
import FormTarde from './pages/FormTarde';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { getRutaSegunHorario, getTurnoActivo } from './utils/horario';

function RutaProtegida({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Guardián de ruta de turno:
 * Si el usuario se encuentra en un turno que no está en servicio pero el otro turno sí está habilitado,
 * lo redirige de forma automática a la ruta habilitada.
 */
function RutaTurnoGuard({ turno, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('SISEDGUA_BYPASS_SCHEDULE') === 'true') {
      return;
    }

    const verificarHorario = () => {
      const activo = getTurnoActivo();
      if (activo && activo !== turno) {
        const destino = activo === 'MAÑANA' ? '/manana' : '/tarde';
        navigate(destino, { replace: true });
      }
    };

    verificarHorario();
    const interval = setInterval(verificarHorario, 15000);
    return () => clearInterval(interval);
  }, [turno, navigate]);

  return children;
}

/**
 * Redirección dinámica según el horario legal en Venezuela (UTC-4):
 * Determina cuál ruta está habilitada y redirige automáticamente.
 */
function RedireccionAutomatica() {
  return <Navigate to={getRutaSegunHorario()} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RedireccionAutomatica />} />
      <Route
        path="/manana"
        element={
          <RutaTurnoGuard turno="MAÑANA">
            <FormManana />
          </RutaTurnoGuard>
        }
      />
      <Route
        path="/tarde"
        element={
          <RutaTurnoGuard turno="TARDE">
            <FormTarde />
          </RutaTurnoGuard>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<RedireccionAutomatica />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased">
          <Navbar />
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
