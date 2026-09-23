import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import ExportButton from '../components/ExportButton';
import GestionInstituciones from '../components/GestionInstituciones';
import GestionCapacidadMunicipios from '../components/GestionCapacidadMunicipios';
import { getStats, getPorMunicipio, getTendencia, getReportes } from '../services/api';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

export default function Dashboard() {
  const { admin, logout } = useAuth();

  // Pestaña activa: 'estadisticas' | 'municipios' | 'instituciones'
  const [pestanaActiva, setPestanaActiva] = useState('estadisticas');

  const fechaHoy = new Date().toISOString().split('T')[0];
  const primerDiaMes = fechaHoy.substring(0, 7) + '-01';

  const [filtros, setFiltros] = useState({
    desde: primerDiaMes,
    hasta: fechaHoy,
    turno: '',
    municipio: ''
  });

  const [stats, setStats] = useState(null);
  const [municipiosData, setMunicipiosData] = useState([]);
  const [tendenciaData, setTendenciaData] = useState([]);
  const [reportesData, setReportesData] = useState([]);
  const [totalReportes, setTotalReportes] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params = { ...filtros };
      const [resStats, resMun, resTen, resRep] = await Promise.all([
        getStats(params),
        getPorMunicipio(params),
        getTendencia(params),
        getReportes({ ...params, page, limit: 15 })
      ]);

      setStats(resStats.data);
      setMunicipiosData(resMun.data || []);
      setTendenciaData(resTen.data || []);
      setReportesData(resRep.data?.data || []);
      setTotalReportes(resRep.data?.total || 0);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (pestanaActiva === 'estadisticas') {
      cargarDatos();
    }
  }, [filtros, page, pestanaActiva]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sub-Cabecera de Administración con Perfil */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shadow-xs">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  Panel Central de Control
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold uppercase">
                  Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Centro Desarrollo de la Calidad Educativa Guárico · Auditoría de 15 Municipios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Selector de Pestañas Sobrio y Profesional */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setPestanaActiva('estadisticas')}
            className={`py-2 px-3.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'estadisticas'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <span>📊</span> Tablero Estadístico & Reportes
          </button>

          <button
            onClick={() => setPestanaActiva('municipios')}
            className={`py-2 px-3.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'municipios'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <span>🏛️</span> Matrícula y Personal Máximo por Municipio
          </button>

          <button
            onClick={() => setPestanaActiva('instituciones')}
            className={`py-2 px-3.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'instituciones'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <span>🏫</span> Catálogo Escolar de Instituciones
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {pestanaActiva === 'municipios' ? (
          /* Pestaña: Matrícula y Personal Máximo Oficial por Municipio y Turno */
          <GestionCapacidadMunicipios />
        ) : pestanaActiva === 'instituciones' ? (
          /* Pestaña: Catálogo de Instituciones */
          <GestionInstituciones />
        ) : (
          /* Pestaña: Métricas, Gráficas, Filtros y Tabla */
          <>
            {/* Barra de Filtros en Blanco Puro con Acentos Azules */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-5 sm:p-6 flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={filtros.desde}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, desde: e.target.value })); setPage(1); }}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, hasta: e.target.value })); setPage(1); }}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                    Turno
                  </label>
                  <select
                    value={filtros.turno}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, turno: e.target.value })); setPage(1); }}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
                  >
                    <option value="">Todos los Turnos</option>
                    <option value="MAÑANA">☀️ Turno Mañana</option>
                    <option value="TARDE">🌙 Turno Tarde</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                    Municipio
                  </label>
                  <select
                    value={filtros.municipio}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, municipio: e.target.value })); setPage(1); }}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
                  >
                    <option value="">Todos los Municipios</option>
                    {MUNICIPIOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExportButton filtros={filtros} />
              </div>
            </div>

            {/* Tarjetas KPIs Estadísticas */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                  icon="📋"
                  label="Instituciones Reportadas"
                  value={stats.total_reportes || 0}
                  subtext="Muestra Activa"
                  color="blue"
                />
                <StatsCard
                  icon="🟢"
                  label="Estudiantes Asistentes"
                  value={(stats.estudiantes_asistente || 0).toLocaleString('es-VE')}
                  subtext="Presencialidad"
                  color="green"
                />
                <StatsCard
                  icon="🔴"
                  label="Estudiantes Inasistentes"
                  value={(stats.estudiantes_inasistente || 0).toLocaleString('es-VE')}
                  subtext="Ausentismo"
                  color="red"
                />
                <StatsCard
                  icon="📊"
                  label="Tasa Global Asistencia"
                  value={`${stats.pct_asistencia || 0}%`}
                  subtext="Rendimiento"
                  color="amber"
                />
              </div>
            )}

            {/* Gráficos Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras: Asistencia por Municipio */}
              <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-50 text-blue-600">📍</span> Asistencia Estudiantil por Municipio
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={municipiosData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="municipio" tick={{ fontSize: 10, fill: '#64748B' }} angle={-35} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #BFDBFE', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="matricula_asistente" name="Asistentes" fill="#2563EB" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="matricula_inasistente" name="Inasistentes" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Líneas: Tendencia Temporal */}
              <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-50 text-blue-600">📈</span> Tendencia Diaria de Participación
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #BFDBFE', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="asistente" name="Est. Asistentes" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#1D4ED8' }} />
                      <Line type="monotone" dataKey="inasistente" name="Est. Inasistentes" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabla Detallada con Paginación */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-blue-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="p-1 rounded bg-blue-50 text-blue-600">📑</span> Registros Detallados de Asistencia ({totalReportes})
                </h3>
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Orden cronológico
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Turno</th>
                      <th className="px-4 py-3.5">Fecha</th>
                      <th className="px-4 py-3.5">Municipio</th>
                      <th className="px-4 py-3.5">Institución</th>
                      <th className="px-4 py-3.5">Director(a)</th>
                      <th className="px-4 py-3.5 text-center">Est. Asist.</th>
                      <th className="px-4 py-3.5 text-center">Est. Inasist.</th>
                      <th className="px-4 py-3.5 text-center">Hora Registro</th>
                      <th className="px-4 py-3.5">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportesData.length > 0 ? (
                      reportesData.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              rep.turno === 'MAÑANA'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}>
                              {rep.turno}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">{rep.fecha}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {Array.isArray(rep.municipio) ? rep.municipio.join(', ') : rep.municipio}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate" title={rep.nombre_institucion}>
                            {rep.nombre_institucion}
                            {rep.es_institucion_manual && (
                              <span className="ml-1.5 text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Manual
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{rep.nombre_director}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-900">{rep.matricula_asistente}</td>
                          <td className="px-4 py-3 text-center font-bold text-rose-600">{rep.matricula_inasistente}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500 whitespace-nowrap">
                            {rep.created_at
                              ? new Date(rep.created_at).toLocaleTimeString('es-VE', { hour12: false, timeZone: 'America/Caracas' })
                              : '--:--'}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-600" title={rep.incidencias}>
                            {rep.incidencias}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                          No se encontraron reportes con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginador */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  ← Anterior
                </button>
                <span className="text-slate-500 font-medium">
                  Página {page} de {Math.max(1, Math.ceil(totalReportes / 15))}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalReportes / 15)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
