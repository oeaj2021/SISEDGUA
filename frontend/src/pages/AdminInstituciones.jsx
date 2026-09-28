import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GestionInstituciones from '../components/GestionInstituciones';

export default function AdminInstituciones() {
  const { admin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sub-Cabecera de Administración con Perfil */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shadow-xs">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  Administración de Instituciones Educativas
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold uppercase">
                  Módulo Independiente
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sala Situacional CDCE ESTADAL GUÁRICO · Catálogo Oficial de Centros Educativos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs"
            >
              <span>📊</span>
              <span>Volver al Dashboard</span>
            </Link>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold block text-slate-800">{admin?.nombre || 'Administrador'}</span>
              <span className="text-[11px] text-slate-400 block">{admin?.email}</span>
            </div>

            <button
              onClick={logout}
              className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-medium py-1.5 px-3 rounded-lg transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal con Gestión de Instituciones */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        <GestionInstituciones />
      </main>
    </div>
  );
}
