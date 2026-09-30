import React, { useState, useEffect } from 'react';
import { getNoReportadas } from '../services/api';
import ExportButton from './ExportButton';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

export default function InstitucionesNoReportadas({ filtros, onFiltroChange, onVolver }) {
  const [dataInfo, setDataInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [municipioFiltro, setMunicipioFiltro] = useState(filtros.municipio || '');

  const cargarNoReportadas = async () => {
    setCargando(true);
    try {
      const params = {
        ...filtros,
        municipio: municipioFiltro || undefined
      };
      const res = await getNoReportadas(params);
      setDataInfo(res.data);
    } catch (err) {
      console.error('Error cargando instituciones no reportadas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNoReportadas();
  }, [filtros.desde, filtros.hasta, filtros.turno, municipioFiltro]);

  const listaFiltrada = (dataInfo?.data || []).filter((inst) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      (inst.nombre && inst.nombre.toLowerCase().includes(q)) ||
      (inst.codigo && inst.codigo.toLowerCase().includes(q)) ||
      (inst.municipio && inst.municipio.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-2xl shadow-xs">
            ⚠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Instituciones Pendientes por Reportar
              </h2>
              <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-bold uppercase">
                Auditoría Activa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de asistencia en tiempo real · Período: {filtros.desde || 'Inicio'} al {filtros.hasta || 'Hoy'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onVolver}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            ← Volver al Tablero
          </button>
          <ExportButton filtros={{ ...filtros, municipio: municipioFiltro }} />
        </div>
      </div>

      {/* Tarjetas de Métricas de Cumplimiento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
            Catálogo Oficial Activo
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {dataInfo?.total_catalogo || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Instituciones registradas</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">
            Instituciones al Día
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {dataInfo?.total_reportadas || 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            {dataInfo?.total_catalogo > 0
              ? `${(((dataInfo.total_reportadas || 0) / dataInfo.total_catalogo) * 100).toFixed(1)}% cobertura`
              : '0%'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs bg-rose-50/30">
          <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider block">
            Sin Reportar (Pendientes)
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {dataInfo?.total_no_reportadas || 0}
          </div>
          <span className="text-[10px] text-rose-600 font-bold">
            {dataInfo?.porcentaje_no_reportadas || 0}% de omisión
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider block">
            Filtro de Turno
          </span>
          <div className="text-lg font-black text-blue-900 mt-2">
            {filtros.turno ? `Turno ${filtros.turno}` : 'Ambos Turnos'}
          </div>
          <span className="text-[10px] text-blue-600 font-medium">
            {municipioFiltro ? `En ${municipioFiltro}` : 'En todo el estado'}
          </span>
        </div>
      </div>

      {/* Grid de Resumen por Municipio */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>🏛️</span> Avance de Reportes por Municipio
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Haga clic en un municipio para filtrar la lista
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <button
            onClick={() => setMunicipioFiltro('')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              !municipioFiltro
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
            }`}
          >
            <div className="text-[10px] uppercase font-black opacity-80">General</div>
            <div className="text-sm font-black mt-0.5">Todos</div>
            <div className="text-[10px] font-semibold mt-1">
              {dataInfo?.total_no_reportadas || 0} pendientes
            </div>
          </button>

          {(dataInfo?.por_municipio || []).map((m) => {
            const isActivo = municipioFiltro === m.municipio;
            const alDia = m.no_reportadas === 0;

            return (
              <button
                key={m.municipio}
                onClick={() => setMunicipioFiltro(isActivo ? '' : m.municipio)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  isActivo
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : alDia
                    ? 'bg-emerald-50/40 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-black truncate ${isActivo ? 'text-blue-100' : 'text-slate-500'}`}>
                    {m.municipio}
                  </span>
                  {alDia ? (
                    <span className="text-[10px] font-black text-emerald-600">✓</span>
                  ) : (
                    <span className={`text-[10px] font-black ${isActivo ? 'text-white' : 'text-rose-600'}`}>
                      {m.no_reportadas}
                    </span>
                  )}
                </div>
                <div className="text-sm font-black mt-0.5">
                  {m.reportadas} / {m.total}
                </div>
                <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${alDia ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, parseFloat(m.pct_reportadas) || 0)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla de Instituciones que NO Han Reportado */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Listado de Instituciones Sin Reportar ({listaFiltrada.length})
            </h3>
            {municipioFiltro && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                {municipioFiltro}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por plantel o código DEA..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium text-slate-800"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Municipio</th>
                <th className="px-4 py-3.5">Nombre de la Institución</th>
                <th className="px-4 py-3.5 text-center">Código DEA</th>
                <th className="px-4 py-3.5 text-center">Turno Oficial</th>
                <th className="px-4 py-3.5 text-center">Matrícula Estimada</th>
                <th className="px-4 py-3.5 text-center">Docentes Estimados</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Consultando registros de auditoría...
                  </td>
                </tr>
              ) : listaFiltrada.length > 0 ? (
                listaFiltrada.map((inst, idx) => (
                  <tr key={inst.id || idx} className="hover:bg-rose-50/30 transition">
                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {inst.municipio}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-md">
                      {inst.nombre}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 whitespace-nowrap">
                      {inst.codigo || <span className="text-slate-300">S/C</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {inst.turno || 'AMBOS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {inst.max_matricula ? inst.max_matricula.toLocaleString('es-VE') : '--'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {inst.max_docentes ? inst.max_docentes.toLocaleString('es-VE') : '--'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                        ⚠️ PENDIENTE
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-3xl">🎉</div>
                      <div className="font-bold text-slate-800 text-sm">
                        ¡Todas las instituciones han reportado!
                      </div>
                      <p className="text-xs text-slate-500">
                        No hay planteles pendientes con los filtros aplicados en este período.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
