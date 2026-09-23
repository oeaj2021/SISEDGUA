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
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs">
      {/* Cintillo Informativo Superior: Conteo por Municipio Registrados Hoy */}
      <ConteoMunicipiosBar />

      {/* Barra Principal de Navegación Profesional y Limpia */}
      <nav className="bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Identidad / Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shadow-xs group-hover:bg-blue-100 transition-colors">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  SISEDGUA
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                  Guárico
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal hidden md:block">
                Centro Desarrollo de la Calidad Educativa Guárico · Control de Asistencia
              </p>
            </div>
          </NavLink>

          {/* Reloj y Estado del Turno (Centro en Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-tight">
                Hora Oficial (VE)
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {horaVE}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              {turnoActivo === 'MAÑANA' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Turno Mañana Abierto
                </span>
              )}
              {turnoActivo === 'TARDE' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Turno Tarde Abierto
                </span>
              )}
              {!turnoActivo && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
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
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  ACTIVO
                </span>
              )}
            </NavLink>

            {/* Reporte en la Tarde */}
            <NavLink to="/tarde" className={navLinkClass}>
              <span>🌙</span>
              <span>Reporte en la Tarde</span>
              {turnoActivo === 'TARDE' && (
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  ACTIVO
                </span>
              )}
            </NavLink>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* Login / Dashboard */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`
                  }
                >
                  <span>📊</span>
                  <span>Panel Admin</span>
                </NavLink>
                <button
                  onClick={handleCerrarSesion}
                  title="Cerrar Sesión"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium border border-slate-200 transition"
                >
                  Salir
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
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
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 focus:outline-none"
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
          <div className="md:hidden pt-3 pb-2 border-t border-slate-200 mt-2 space-y-1.5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Hora Oficial (VE):</span>
              <span className="font-mono font-bold text-slate-800">{horaVE}</span>
            </div>

            <NavLink
              to="/manana"
              onClick={() => setMenuAbierto(false)}
              className={navLinkClass}
            >
              <span>☀️</span>
              <span className="flex-1">Reporte Mañana</span>
              {turnoActivo === 'MAÑANA' ? (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">07:00-12:00</span>
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
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  ACTIVO
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">13:00-22:00</span>
              )}
            </NavLink>

            <div className="border-t border-slate-200 pt-2">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMenuAbierto(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white"
                  >
                    <span>📊</span>
                    <span>Panel Admin</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      handleCerrarSesion();
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-rose-700 text-xs font-semibold border border-slate-200"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
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
