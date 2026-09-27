import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
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

    {/* PESTAÑA 2: ESTADÍSTICAS Y GRÁFICOS */}
    {tabActiva === 'estadisticas' && (
      <div className="space-y-6">
        {/* KPI Cards */}
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
              <span className="text-[11px] text-slate-400 mt-1 block">
                {stats.totalRegistros > 0 ? ((stats.enAsambleas / stats.totalRegistros) * 100).toFixed(1) : 0}% de participación
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Voceros en Comité
              </span>
              <p className="text-3xl font-black text-emerald-700 mt-2">{stats.conComite || 0}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {stats.totalRegistros > 0 ? ((stats.conComite / stats.totalRegistros) * 100).toFixed(1) : 0}% con vocería activa
              </span>
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

        {/* Gráficos Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Participación por Municipio */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <span>📍</span> Participación por Municipio
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.porMunicipio || []).map((m) => ({
                    municipio: m.municipio,
                    Total: Number(m.total)
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="municipio"
                    angle={-45}
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
                  <Bar dataKey="Total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Participación por Tipo de Personal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <span>👥</span> Distribución por Tipo de Personal
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.porTipoPersonal || []).map((t) => ({
                    tipo: t.tipo_personal || 'Sin asignar',
                    Total: Number(t.total)
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="tipo"
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
                  <Bar dataKey="Total" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabla Resumen de Municipios */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
            <span>📋</span> Consolidado Municipal en Consejos Comunales
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Municipio</th>
                  <th className="px-4 py-2.5 text-center">Registrados</th>
                  <th className="px-4 py-2.5 text-center">Porcentaje (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.porMunicipio || []).map((m) => {
                  const pct = stats.totalRegistros > 0
                    ? ((Number(m.total) / stats.totalRegistros) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={m.municipio} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-bold text-slate-900">{m.municipio}</td>
                      <td className="px-4 py-2 text-center font-bold text-blue-800">{m.total}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  Registrado el {new Date(selectedItem.createdAt).toLocaleString('es-VE')}
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
