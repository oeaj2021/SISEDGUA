import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTurnoActivo,
  getHoraVenezuelaFormateada
} from '../utils/horario';
import ConteoMunicipiosBar from './ConteoMunicipiosBar';

export default function Navbar() {
  const { isAuthenticated, admin, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [horaVE, setHoraVE] = useState(getHoraVenezuelaFormateada());
  const [turnoActivo, setTurnoActivo] = useState(getTurnoActivo());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraVE(getHoraVenezuelaFormateada());
      setTurnoActivo(getTurnoActivo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
      isActive
        ? 'bg-white text-blue-900 shadow-sm'
        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Cintillo Informativo Superior: Conteo por Municipio Registrados Hoy */}
      <ConteoMunicipiosBar />

      {/* Barra Principal de Navegación en Azul Real y Blanco */}
      <nav className="bg-blue-900 border-b border-blue-950 px-4 py-2.5 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Identidad / Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-900 flex items-center justify-center text-xl font-black shadow-sm group-hover:bg-blue-50 transition-colors">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base sm:text-lg tracking-tight">
                  SISEDGUA
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider bg-amber-400 text-blue-950 px-2 py-0.5 rounded-md shadow-xs">
                  Guárico
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium hidden md:block">
                Centro Desarrollo de la Calidad Educativa Guárico · Control de Asistencia
              </p>
            </div>
          </NavLink>

          {/* Reloj y Estado del Turno (Centro en Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-blue-950 border border-blue-800 px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider block leading-tight">
                Hora Oficial (VE)
              </span>
              <span className="font-mono text-xs font-black text-white">
                {horaVE}
              </span>
            </div>
            <div className="h-5 w-px bg-blue-800"></div>
            <div>
              {turnoActivo === 'MAÑANA' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-400 text-blue-950 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-950"></span>
                  Turno Mañana Abierto
                </span>
              )}
              {turnoActivo === 'TARDE' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-300 text-blue-950 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-950"></span>
                  Turno Tarde Abierto
                </span>
              )}
              {!turnoActivo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-950 text-blue-200 border border-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Fuera de Horario
                </span>
              )}
            </div>
          </div>

          {/* Links de Navegación en Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Reporte Mañana */}
            <NavLink to="/manana" className={navLinkClass}>
              <span>☀️</span>
              <span>Reporte Mañana</span>
              {turnoActivo === 'MAÑANA' && (
                <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                  ACTIVO
                </span>
              )}
            </NavLink>

            {/* Reporte en la Tarde */}
            <NavLink to="/tarde" className={navLinkClass}>
              <span>🌙</span>
              <span>Reporte en la Tarde</span>
              {turnoActivo === 'TARDE' && (
                <span className="bg-sky-400 text-blue-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                  ACTIVO
                </span>
              )}
            </NavLink>

            <div className="h-5 w-px bg-blue-800 mx-1"></div>

            {/* Login / Dashboard */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-sm'
                        : 'bg-blue-800 text-white hover:bg-blue-700'
                    }`
                  }
                >
                  <span>📊</span>
                  <span>Panel Admin</span>
                </NavLink>
                <button
                  onClick={handleCerrarSesion}
                  title="Cerrar Sesión"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-950 hover:bg-red-800 text-blue-200 hover:text-white text-xs font-bold transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-md ring-2 ring-white/50'
                      : 'bg-white text-blue-900 hover:bg-blue-50 shadow-sm'
                  }`
                }
              >
                <span>🔐</span>
                <span>Login</span>
              </NavLink>
            )}
          </div>

          {/* Botón Móvil Hamburguesa */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label="Abrir Menú"
              className="p-2 rounded-lg bg-blue-800 text-white hover:bg-blue-700 focus:outline-none"
            >
              {menuAbierto ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desplegable Móvil */}
        {menuAbierto && (
          <div className="md:hidden pt-3 pb-2 border-t border-blue-800 mt-2 space-y-1.5">
            <div className="bg-blue-950 rounded-lg p-2.5 mb-2 flex items-center justify-between text-xs">
              <span className="text-blue-200 font-medium">Hora Oficial (VE):</span>
              <span className="font-mono font-black text-white">{horaVE}</span>
            </div>

            <NavLink
              to="/manana"
              onClick={() => setMenuAbierto(false)}
              className={navLinkClass}
            >
              <span>☀️</span>
              <span className="flex-1">Reporte Mañana</span>
              {turnoActivo === 'MAÑANA' ? (
                <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-blue-200 font-mono">07:00-12:00</span>
              )}
            </NavLink>

            <NavLink
              to="/tarde"
              onClick={() => setMenuAbierto(false)}
              className={navLinkClass}
            >
              <span>🌙</span>
              <span className="flex-1">Reporte en la Tarde</span>
              {turnoActivo === 'TARDE' ? (
                <span className="bg-sky-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-blue-200 font-mono">13:00-22:00</span>
              )}
            </NavLink>

            <div className="border-t border-blue-800 pt-2">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMenuAbierto(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white text-blue-900"
                  >
                    <span>📊</span>
                    <span>Panel Admin</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      handleCerrarSesion();
                    }}
                    className="px-3 py-2 rounded-lg bg-blue-950 text-white text-xs font-bold"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black bg-white text-blue-900"
                >
                  <span>🔐</span>
                  <span>Login</span>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
