import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTurnoActivo,
  getHoraVenezuelaFormateada,
  HORARIOS
} from '../utils/horario';
import ConteoMunicipiosBar from './ConteoMunicipiosBar';

export default function Navbar() {
  const { isAuthenticated, admin, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [horaVE, setHoraVE] = useState(getHoraVenezuelaFormateada());
  const [turnoActivo, setTurnoActivo] = useState(getTurnoActivo());
  const location = useLocation();
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
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
      isActive
        ? 'bg-blue-800 text-white shadow-md shadow-blue-900/30'
        : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Cintillo Informativo Superior: Conteo por Municipio Registrados Hoy */}
      <ConteoMunicipiosBar />

      {/* Barra Principal de Navegación */}
      <nav className="bg-slate-950 border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Identidad / Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-950/40 group-hover:scale-105 transition-transform">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base md:text-lg tracking-tight">
                  SISEDGUA
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Guárico
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                Zona Educativa · Control de Asistencia
              </p>
            </div>
          </NavLink>

          {/* Reloj y Estado del Turno (Centro en Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block leading-tight">
                HORA LEGAL (VE)
              </span>
              <span className="font-mono text-xs font-black text-slate-100">
                {horaVE}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              {turnoActivo === 'MAÑANA' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Turno Mañana Abierto
                </span>
              )}
              {turnoActivo === 'TARDE' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  Turno Tarde Abierto
                </span>
              )}
              {!turnoActivo && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
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
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  ACTIVO
                </span>
              )}
            </NavLink>

            {/* Reporte en la Tarde */}
            <NavLink to="/tarde" className={navLinkClass}>
              <span>🌙</span>
              <span>Reporte en la Tarde</span>
              {turnoActivo === 'TARDE' && (
                <span className="bg-blue-400 text-blue-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  ACTIVO
                </span>
              )}
            </NavLink>

            <div className="h-6 w-px bg-slate-800 mx-1"></div>

            {/* Login / Dashboard */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`
                  }
                >
                  <span>📊</span>
                  <span>Panel Admin</span>
                </NavLink>
                <button
                  onClick={handleCerrarSesion}
                  title="Cerrar Sesión"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 text-xs font-bold transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
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
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {menuAbierto ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desplegable Móvil */}
        {menuAbierto && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-800 mt-2 space-y-2">
            <div className="bg-slate-900 rounded-xl p-2.5 mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Hora Legal (VE):</span>
              <span className="font-mono font-bold text-white">{horaVE}</span>
            </div>

            <NavLink
              to="/manana"
              onClick={() => setMenuAbierto(false)}
              className={navLinkClass}
            >
              <span>☀️</span>
              <span className="flex-1">Reporte Mañana</span>
              {turnoActivo === 'MAÑANA' ? (
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">07:00-12:00</span>
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
                <span className="bg-blue-400 text-blue-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">13:00-22:00</span>
              )}
            </NavLink>

            <div className="border-t border-slate-800 pt-2">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMenuAbierto(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                  >
                    <span>📊</span>
                    <span>Panel Admin</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      handleCerrarSesion();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-red-300 text-xs font-bold"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white border border-slate-700"
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
