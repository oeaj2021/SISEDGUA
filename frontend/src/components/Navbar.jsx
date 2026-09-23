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
    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
        : 'text-blue-100/90 hover:text-white hover:bg-blue-900/40 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-50 shadow-xl shadow-blue-950/20">
      {/* Cintillo Informativo Superior: Conteo por Municipio Registrados Hoy */}
      <ConteoMunicipiosBar />

      {/* Barra Principal de Navegación con degradado azul y detalles en blanco */}
      <nav className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 border-b border-blue-500/20 px-4 py-3 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Identidad / Logo */}
          <NavLink to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 border border-blue-400/40 group-hover:scale-105 group-hover:shadow-blue-500/50 transition-all duration-300">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg md:text-xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  SISEDGUA
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider bg-white text-blue-950 px-2 py-0.5 rounded-full shadow-sm">
                  Guárico
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium hidden md:block">
                Zona Educativa · Control y Asistencia Escolar
              </p>
            </div>
          </NavLink>

          {/* Reloj y Estado del Turno (Centro en Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-blue-950/80 border border-blue-500/30 px-4 py-1.5 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block leading-tight">
                Hora Legal (VE)
              </span>
              <span className="font-mono text-xs font-black text-white tracking-wide">
                {horaVE}
              </span>
            </div>
            <div className="h-6 w-px bg-blue-800/80"></div>
            <div>
              {turnoActivo === 'MAÑANA' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-500/20 text-sky-200 border border-blue-400/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  Turno Mañana Abierto
                </span>
              )}
              {turnoActivo === 'TARDE' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-indigo-500/20 text-blue-200 border border-indigo-400/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Turno Tarde Abierto
                </span>
              )}
              {!turnoActivo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Fuera de Horario
                </span>
              )}
            </div>
          </div>

          {/* Links de Navegación en Desktop */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Reporte Mañana */}
            <NavLink to="/manana" className={navLinkClass}>
              <span>☀️</span>
              <span>Reporte Mañana</span>
              {turnoActivo === 'MAÑANA' && (
                <span className="bg-white text-blue-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                  ACTIVO
                </span>
              )}
            </NavLink>

            {/* Reporte en la Tarde */}
            <NavLink to="/tarde" className={navLinkClass}>
              <span>🌙</span>
              <span>Reporte en la Tarde</span>
              {turnoActivo === 'TARDE' && (
                <span className="bg-white text-blue-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                  ACTIVO
                </span>
              )}
            </NavLink>

            <div className="h-6 w-px bg-blue-800/80 mx-1"></div>

            {/* Login / Dashboard */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-md font-black'
                        : 'bg-blue-900/60 text-blue-100 hover:bg-blue-800 hover:text-white border border-blue-500/30'
                    }`
                  }
                >
                  <span>📊</span>
                  <span>Panel Admin</span>
                </NavLink>
                <button
                  onClick={handleCerrarSesion}
                  title="Cerrar Sesión"
                  className="px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 text-xs font-bold border border-slate-800 transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all duration-200 shadow-md ${
                    isActive
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-white text-blue-950 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]'
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
              className="p-2 rounded-xl bg-blue-900/60 text-blue-200 hover:text-white border border-blue-500/30 focus:outline-none"
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
          <div className="md:hidden pt-3 pb-2 border-t border-blue-900/40 mt-2 space-y-2">
            <div className="bg-blue-950/90 border border-blue-800/40 rounded-xl p-3 mb-2 flex items-center justify-between text-xs">
              <span className="text-blue-300 font-semibold">Hora Legal (VE):</span>
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
                <span className="bg-white text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-blue-300/70 font-mono">07:00-12:00</span>
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
                <span className="bg-white text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-blue-300/70 font-mono">13:00-22:00</span>
              )}
            </NavLink>

            <div className="border-t border-blue-900/40 pt-2">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMenuAbierto(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-white text-blue-950"
                  >
                    <span>📊</span>
                    <span>Panel Admin</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      handleCerrarSesion();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-red-300 text-xs font-bold border border-slate-800"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-white text-blue-950 hover:bg-blue-50 shadow-md"
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
