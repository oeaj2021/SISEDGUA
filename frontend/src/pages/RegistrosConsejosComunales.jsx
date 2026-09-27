import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  getConsejosComunales,
  getConsejosComunalesStats,
  exportConsejosComunalesExcel
} from '../services/api';
import { MUNICIPIOS_GUARICO } from '../utils/guaricoData';
import GestionPadron from '../components/GestionPadron';
import GestionInstituciones from '../components/GestionInstituciones';

export default function RegistrosConsejosComunales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tabActiva, setTabActiva] = useState(
    ['registros', 'estadisticas', 'padron', 'instituciones'].includes(tabParam) ? tabParam : 'registros'
  );
  const [registros, setRegistros] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Sincronizar tab desde URL si cambia externamente (ej. navegación de Navbar)
  useEffect(() => {
    if (tabParam && ['registros', 'estadisticas', 'padron', 'instituciones'].includes(tabParam)) {
      setTabActiva(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (nuevaTab) => {
    setTabActiva(nuevaTab);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', nuevaTab);
      return p;
    });
  };

  // Filtros
  const [search, setSearch] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [tipoPersonal, setTipoPersonal] = useState('');
  const [formaParteComite, setFormaParteComite] = useState('');
  const [genero, setGenero] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const fetchRegistros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConsejosComunales({
        page,
        limit: 15,
        search,
        municipio,
        tipo_personal: tipoPersonal,
        forma_parte_comite: formaParteComite,
        genero: genero || undefined
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const total = Array.isArray(res.data) ? res.data.length : (res.data?.total ?? data.length);
      const pages = res.data?.totalPages || Math.ceil(total / 15) || 1;
      setRegistros(data);
      setTotalPages(pages);
      setTotalRegistros(total);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor o cargar los registros.');
    } finally {
      setLoading(false);
    }
  }, [page, search, municipio, tipoPersonal, formaParteComite, genero]);

  const fetchStats = async () => {
    try {
      const res = await getConsejosComunalesStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await exportConsejosComunalesExcel({
        municipio: municipio || undefined,
        tipo_personal: tipoPersonal || undefined
      });

      let blobData = res.data;
      if (blobData instanceof Blob && blobData.type && blobData.type.includes('application/json')) {
        const text = await blobData.text();
        const json = JSON.parse(text);
        throw new Error(json.error || 'Error al generar reporte Excel');
      }

      const blob = blobData instanceof Blob
        ? new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        : new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Registros_Consejos_Comunales_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      alert('Error al descargar el archivo Excel: ' + (err.response?.data?.error || err.message || 'Error de conexión'));
    } finally {
      setExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setMunicipio('');
    setTipoPersonal('');
    setFormaParteComite('');
    setGenero('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera y Acciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              <span>🏛️</span>
              Sala Situacional CDCE ESTADAL GUÁRICO
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Registros: Sector Educativo en Consejos Comunales
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consolidado y auditoría de docentes, directivos, obreros y cocineras integrados al Poder Popular.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                fetchRegistros();
                fetchStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Recargar listado y estadísticas"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Actualizar Lista</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
            >
              <span>📊</span>
              <span>{exporting ? 'Generando Excel...' : 'Descargar Excel'}</span>
            </button>

            <Link
              to="/consejos-comunales"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs"
            >
              <span>➕</span>
              <span>Nuevo Registro</span>
            </Link>
          </div>
        </div>

        {/* Barra de Pestañas de Navegación del Módulo */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={() => handleTabChange('registros')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              tabActiva === 'registros'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📋</span>
            <span>Registros Comunitarios ({totalRegistros})</span>
          </button>

          <button
            onClick={() => handleTabChange('estadisticas')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              tabActiva === 'estadisticas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📊</span>
            <span>Estadísticas y Gráficos</span>
          </button>

          <button
            onClick={() => handleTabChange('padron')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              tabActiva === 'padron'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>👥</span>
            <span>Gestión de Padrón (Cédulas)</span>
          </button>

          <button
            onClick={() => handleTabChange('instituciones')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              tabActiva === 'instituciones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🏫</span>
            <span>Catálogo de Instituciones</span>
          </button>
        </div>

        {/* PESTAÑA 1: REGISTROS COMUNITARIOS */}
        {tabActiva === 'registros' && (
          <div className="space-y-6">
            {/* Tarjetas KPI */}
            {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Registrados
              </span>
              <p className="text-3xl font-black text-blue-900 mt-2">{stats.totalRegistros || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Sector Educativo Guárico</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                En Asambleas
              </span>
              <p className="text-3xl font-black text-indigo-700 mt-2">{stats.enAsambleas || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Participan activamente</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Voceros en Comité
              </span>
              <p className="text-3xl font-black text-emerald-700 mt-2">{stats.conComite || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Comités de Ley Orgánica</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Municipios Activos
              </span>
              <p className="text-3xl font-black text-amber-700 mt-2">
                {stats.porMunicipio ? stats.porMunicipio.length : 0} / 15
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Cobertura Territorial</span>
            </div>
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Buscador */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Búsqueda Rápida
              </label>
              <input
                type="text"
                placeholder="Cédula, nombre o comunidad..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Municipio */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Municipio
              </label>
              <select
                value={municipio}
                onChange={(e) => {
                  setMunicipio(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">Todos los Municipios</option>
                {Object.entries(MUNICIPIOS_GUARICO).map(([key, data]) => (
                  <option key={key} value={key}>
                    {data.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Personal */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de Personal
              </label>
              <select
                value={tipoPersonal}
                onChange={(e) => {
                  setTipoPersonal(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">Todos los Roles</option>
                <option value="Docente">Docente</option>
                <option value="Obrero">Obrero</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Cocinera(o) de la Patria">Cocinera(o) de la Patria</option>
                <option value="Directivo / Supervisor">Directivo / Supervisor</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Género */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Género
              </label>
              <select
                value={genero}
                onChange={(e) => {
                  setGenero(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">Todos</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>

            {/* En Comité */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                ¿En Comité?
              </label>
              <select
                value={formaParteComite}
                onChange={(e) => {
                  setFormaParteComite(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">Todos</option>
                <option value="true">Sí (Forma parte)</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {(search || municipio || tipoPersonal || formaParteComite || genero) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-xs shadow-xs">
            <span className="flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{error}</span>
            </span>
            <button
              onClick={() => {
                fetchRegistros();
                fetchStats();
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla de Registros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Mostrando <span className="text-slate-900 font-extrabold">{registros.length}</span> de{' '}
              <span className="text-slate-900 font-extrabold">{totalRegistros}</span> registros encontrados
            </span>

            <button
              type="button"
              onClick={() => {
                fetchRegistros();
                fetchStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Actualizar Lista</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-black tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Cédula</th>
                  <th className="py-3.5 px-4">Nombres y Apellidos</th>
                  <th className="py-3.5 px-4">Género / Edad</th>
                  <th className="py-3.5 px-4">Personal</th>
                  <th className="py-3.5 px-4">Municipio / Parroquia</th>
                  <th className="py-3.5 px-4">Comunidad</th>
                  <th className="py-3.5 px-4 text-center">Comité / Vocería</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                      <div className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Cargando registros institucionales...</span>
                      </div>
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  registros.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.nacionalidad}-{item.cedula}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.nombres_apellidos}
                        <span className="block text-[11px] text-slate-400 font-normal">{item.telefono}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">{item.genero || 'N/A'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{item.edad ? `${item.edad} años` : 'N/A'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-slate-900">{item.tipo_personal}</span>
                        {item.tipo_personal_detalle && (
                          <span className="block text-[11px] text-blue-600">({item.tipo_personal_detalle})</span>
                        )}
                        {item.institucion_educativa && (
                          <span className="block text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={item.institucion_educativa}>
                            🏫 {item.institucion_educativa}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{MUNICIPIOS_GUARICO[item.municipio]?.nombre || item.municipio}</span>
                        <span className="block text-[11px] text-slate-500">{item.parroquia}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.comunidad}>
                        {item.comunidad}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.forma_parte_comite ? (
                          <span
                            className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200"
                            title={item.comite_detalle ? `${item.comite} (${item.comite_detalle})` : item.comite}
                          >
                            ✓ {item.comite?.includes('Otro') ? item.comite_detalle || 'Otro' : item.comite?.slice(0, 22) + '...'}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg">
                            Sin Comité
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                ← Anterior
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Página <span className="font-bold text-slate-800">{page}</span> de{' '}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* PESTAÑA 2: ESTADÍSTICAS Y GRÁFICOS COMPARATIVOS */}
    {tabActiva === 'estadisticas' && (
      <div className="space-y-6">
        {/* Cabecera del Dashboard Estadístico */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              <span>📈</span>
              <span>Análisis Descriptivo & Comparativo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Observatorio Estadístico de Participación Popular
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Comparativas multidimensionales por género, roles del sector educativo, rangos etarios y distribución territorial en las 15 jurisdicciones de Guárico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
            >
              <span>🔄</span>
              <span>Actualizar Datos</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer"
            >
              <span>📊</span>
              <span>{exporting ? 'Generando Reporte Multi-Hoja...' : 'Descargar Reporte Excel Completo'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Primer Nivel */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Registrados
              </span>
              <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
                {stats.totalRegistros || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Sector Educativo</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                En Asambleas
              </span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
                {stats.enAsambleas || 0}
              </p>
              <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">
                {stats.totalRegistros > 0 ? ((stats.enAsambleas / stats.totalRegistros) * 100).toFixed(1) : 0}% de participación
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Voceros en Comité
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {stats.conComite || 0}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
                {stats.totalRegistros > 0 ? ((stats.conComite / stats.totalRegistros) * 100).toFixed(1) : 0}% con vocería activa
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Compromiso Pleno
              </span>
              <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
                {stats.compromiso?.pleno || 0}
              </p>
              <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">
                Asamblea + Comité
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Edad Promedio (μ)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                {stats.estadisticasEdad?.media || 0} <span className="text-sm font-normal">años</span>
              </p>
              <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
                σ = ±{stats.estadisticasEdad?.desviacionEstandar || 0} | Mediana: {stats.estadisticasEdad?.mediana || 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Comunidades
              </span>
              <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
                {stats.coberturaTerritorial?.totalComunidades || 0}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                En {stats.coberturaTerritorial?.municipiosActivos || 0} Municipios
              </span>
            </div>
          </div>
        )}

        {/* COMPARATIVA 1 & 2: GÉNERO VS COMITÉS Y TIPO DE PERSONAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico Comparativo 1: Género vs Pertenencia a Comités y Asambleas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>⚧️</span> Comparativa: Género vs Participación Comunal
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  Barras Comparativas
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Total de registrados por género frente a su inclusión en vocerías y asistencia a asambleas.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.porGenero || []).map((g) => ({
                    genero: g.genero,
                    Total: Number(g.total),
                    'En Comité': Number(g.con_comite),
                    'En Asambleas': Number(g.en_asambleas)
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="genero" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="En Comité" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="En Asambleas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Micro-tarjeta de Paridad */}
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              {(stats?.porGenero || []).map((g) => {
                const totalG = Number(g.total) || 0;
                const comiteG = Number(g.con_comite) || 0;
                const tasa = totalG > 0 ? ((comiteG / totalG) * 100).toFixed(1) : 0;
                return (
                  <div key={g.genero} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">{g.genero}:</span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Tasa de Vocería: <strong className="text-emerald-700">{tasa}%</strong> ({comiteG}/{totalG})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico Comparativo 2: Tipo de Personal vs Participación */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>👥</span> Comparativa: Tipo de Personal vs Comité
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                  Roles Institucionales
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Distribución de docentes, administrativos, obreros y cocineras integrados al Consejo Comunal.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.porTipoPersonal || []).map((t) => ({
                    tipo: t.tipo_personal || 'Sin asignar',
                    Total: Number(t.total),
                    'En Comité': Number(t.con_comite),
                    'En Asambleas': Number(t.en_asambleas)
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="tipo"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="En Comité" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 text-right">
              <span className="text-[10px] text-slate-400">
                * Conteo total del personal activo en el sistema
              </span>
            </div>
          </div>
        </div>

        {/* COMPARATIVA 3 & 4: RANGOS ETARIOS Y GRADO DE COMPROMISO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rangos Etarios vs Comités */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>🎂</span> Distribución por Rangos Etarios
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                  Generaciones
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Volumen y tasa de vocería comunal agrupado en cohortes de edad.
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.rangosEdad || []).map((r) => ({
                    rango: r.rango,
                    Total: Number(r.total),
                    'En Comité': Number(r.con_comite)
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="rango" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                  <Bar dataKey="Total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="En Comité" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas Estadísticas Descriptivas */}
            {stats?.estadisticasEdad && (
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] font-black uppercase text-slate-600 mb-2 flex items-center gap-1.5">
                  <span>📐</span> Métricas Descriptivas de Edad (Muestra: {stats.estadisticasEdad.totalMuestra})
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Media</span>
                    <strong className="text-slate-800">{stats.estadisticasEdad.media} a</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Mediana</span>
                    <strong className="text-slate-800">{stats.estadisticasEdad.mediana} a</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Desv. Est (σ)</span>
                    <strong className="text-slate-800">±{stats.estadisticasEdad.desviacionEstandar}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Mínimo</span>
                    <strong className="text-slate-800">{stats.estadisticasEdad.min} a</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Máximo</span>
                    <strong className="text-slate-800">{stats.estadisticasEdad.max} a</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Rango IQR</span>
                    <strong className="text-slate-800">
                      {(stats.estadisticasEdad.q3 - stats.estadisticasEdad.q1).toFixed(1)} a
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grado de Compromiso Comunal (PieChart Dona) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>🎯</span> Grado de Compromiso Comunal
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                  Matriz Cuadrantes
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Segmentación por nivel de activación en asambleas ciudadanas y comités operativos.
              </p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pleno (Asamblea + Comité)', value: stats?.compromiso?.pleno || 0, color: '#059669' },
                      { name: 'Solo Vocero en Comité', value: stats?.compromiso?.soloComite || 0, color: '#2563eb' },
                      { name: 'Solo Asiste a Asambleas', value: stats?.compromiso?.soloAsamblea || 0, color: '#6366f1' },
                      { name: 'Registrado Pasivo', value: stats?.compromiso?.pasivo || 0, color: '#94a3b8' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {[
                      { color: '#059669' },
                      { color: '#2563eb' },
                      { color: '#6366f1' },
                      { color: '#94a3b8' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Resumen numérico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
                <span className="text-[10px] block font-bold">Pleno</span>
                <strong className="text-sm font-black">{stats?.compromiso?.pleno || 0}</strong>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-800">
                <span className="text-[10px] block font-bold">Solo Comité</span>
                <strong className="text-sm font-black">{stats?.compromiso?.soloComite || 0}</strong>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-800">
                <span className="text-[10px] block font-bold">Solo Asamblea</span>
                <strong className="text-sm font-black">{stats?.compromiso?.soloAsamblea || 0}</strong>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <span className="text-[10px] block font-bold">Pasivo</span>
                <strong className="text-sm font-black">{stats?.compromiso?.pasivo || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARATIVA TERRITORIAL POR MUNICIPIO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>📍</span> Comparativa Territorial: 15 Municipios del Estado Guárico
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Volumen de personal registrado comparado contra miembros con vocería activa en cada municipio.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {stats?.porMunicipio?.length || 0} / 15 Municipios con presencia
            </span>
          </div>

          <div className="h-80 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(stats?.porMunicipio || []).map((m) => ({
                  municipio: m.municipio,
                  Total: Number(m.total),
                  'En Comité': Number(m.con_comite),
                  'En Asambleas': Number(m.en_asambleas)
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="municipio"
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Total" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="En Comité" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="En Asambleas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de Matriz Territorial */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Municipio</th>
                  <th className="px-4 py-3 text-center">Total Registrados</th>
                  <th className="px-4 py-3 text-center">En Comité</th>
                  <th className="px-4 py-3 text-center">En Asambleas</th>
                  <th className="px-4 py-3 text-center">Tasa Vocería</th>
                  <th className="px-4 py-3 text-center">% Cobertura Estadal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.porMunicipio || []).map((m) => {
                  const tot = Number(m.total) || 0;
                  const com = Number(m.con_comite) || 0;
                  const asam = Number(m.en_asambleas) || 0;
                  const tasaVoceria = tot > 0 ? ((com / tot) * 100).toFixed(1) : 0;
                  const pctEstadal = stats.totalRegistros > 0
                    ? ((tot / stats.totalRegistros) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={m.municipio} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{m.municipio}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-blue-900">{tot}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-700">{com}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-purple-700">{asam}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md">
                          {tasaVoceria}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded-md">
                          {pctEstadal}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP INSTITUCIONES & TOP COMITÉS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Instituciones Educativas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-2">
              <span>🏫</span> Top 10 Instituciones con Mayor Activación Comunal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Planteles educativos con mayor cantidad de docentes y trabajadores integrados.
            </p>

            <div className="space-y-2.5">
              {(stats?.topInstituciones || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No hay instituciones registradas aún.</p>
              ) : (
                stats.topInstituciones.map((inst, idx) => (
                  <div
                    key={`${inst.institucion_educativa}-${idx}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-black text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                          {inst.institucion_educativa}
                        </h4>
                        <span className="text-[10px] text-slate-500 block">
                          Municipio: {inst.municipio}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-900 block">
                        {inst.total} miembros
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {inst.con_comite} en comité
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Comités / Vocerías Más Representadas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-2">
              <span>🗳️</span> Vocerías y Comités con Mayor Integración
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Áreas y mesas de trabajo del Poder Popular donde participa activamente el sector educativo.
            </p>

            <div className="space-y-2.5">
              {(stats?.porComite || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No hay comités registrados aún.</p>
              ) : (
                stats.porComite.map((c, idx) => (
                  <div
                    key={`${c.comite}-${idx}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <span className="font-bold text-slate-800 text-xs line-clamp-1">
                      {c.comite}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-lg">
                      {c.total} voceros
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* PESTAÑA 3: GESTIÓN DE PADRÓN INSTITUCIONAL */}
    {tabActiva === 'padron' && <GestionPadron />}

    {/* PESTAÑA 4: CATÁLOGO DE INSTITUCIONES */}
    {tabActiva === 'instituciones' && <GestionInstituciones />}

        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                    Ficha de Registro Institucional #{selectedItem.id}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedItem.nombres_apellidos}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-700 text-2xl font-bold p-1 leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
                {/* Sección Personal */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Datos Personales y Laborales</h4>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Cédula:</span>
                      <span className="font-bold text-slate-900">{selectedItem.nacionalidad}-{selectedItem.cedula}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Teléfono:</span>
                      <span className="font-bold text-slate-900">{selectedItem.telefono}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Género:</span>
                      <span className="font-bold text-slate-900">{selectedItem.genero || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Edad:</span>
                      <span className="font-bold text-slate-900">{selectedItem.edad ? `${selectedItem.edad} años` : 'No especificada'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">Tipo de Personal:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedItem.tipo_personal}
                        {selectedItem.tipo_personal_detalle ? ` (${selectedItem.tipo_personal_detalle})` : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">Institución Educativa:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedItem.institucion_educativa || 'No especificada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección Geográfica */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Ubicación Territorial</h4>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Municipio:</span>
                      <span className="font-bold text-slate-900">
                        {MUNICIPIOS_GUARICO[selectedItem.municipio]?.nombre || selectedItem.municipio}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">Parroquia:</span>
                      <span className="font-bold text-slate-900">{selectedItem.parroquia}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">Comunidad:</span>
                      <span className="font-semibold text-slate-900">{selectedItem.comunidad}</span>
                    </div>
                    {selectedItem.circuito_comunal && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Circuito Comunal:</span>
                        <span className="font-medium text-slate-900">{selectedItem.circuito_comunal}</span>
                      </div>
                    )}
                    {selectedItem.comuna && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Comuna:</span>
                        <span className="font-medium text-slate-900">{selectedItem.comuna}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección Participación */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Participación en Poder Popular</h4>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Participa en asambleas:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedItem.participa_asambleas ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {selectedItem.participa_asambleas ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Forma parte de comité:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedItem.forma_parte_comite ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {selectedItem.forma_parte_comite ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    {selectedItem.comite && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 font-bold block text-[11px]">Comité Asignado:</span>
                        <p className="font-semibold text-slate-900">{selectedItem.comite}</p>
                        {selectedItem.comite_detalle && (
                          <p className="text-xs text-blue-700 font-medium mt-0.5">
                            Detalle: {selectedItem.comite_detalle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-right">
                  Registrado el {new Date(selectedItem.createdAt || selectedItem.created_at || Date.now()).toLocaleString('es-VE')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
