import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import ExportButton from '../components/ExportButton';
import GestionInstituciones from '../components/GestionInstituciones';
import { getStats, getPorMunicipio, getTendencia, getReportes } from '../services/api';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

export default function Dashboard() {
  const { admin, logout } = useAuth();

  // Pestaña activa: 'estadisticas' | 'instituciones'
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="bg-blue-950 text-white px-6 py-4 border-b border-blue-900 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-blue-950 font-black rounded-xl flex items-center justify-center text-xl shadow-sm">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight">SISEDGUA</span>
                <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full font-bold uppercase">
                  Zona Educativa Guárico
                </span>
              </div>
              <p className="text-xs text-blue-300">Panel Administrativo Central</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold block">{admin?.nombre || 'Administrador'}</span>
              <span className="text-[11px] text-blue-300 block">{admin?.email}</span>
            </div>
            <button
              onClick={logout}
              className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Selector de Pestañas */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setPestanaActiva('estadisticas')}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              pestanaActiva === 'estadisticas'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📊</span> Tablero Estadístico & Reportes
          </button>
          <button
            onClick={() => setPestanaActiva('instituciones')}
            className={`py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              pestanaActiva === 'instituciones'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏫</span> Catálogo de Instituciones & Matrícula Máxima
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {pestanaActiva === 'instituciones' ? (
          /* Pestaña: CRUD de Instituciones y Capacidad Máxima */
          <GestionInstituciones />
        ) : (
          /* Pestaña: Métricas, Gráficas, Filtros y Tabla */
          <>
            {/* Barra de Filtros */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Fecha Desde</label>
                  <input
                    type="date"
                    value={filtros.desde}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, desde: e.target.value })); setPage(1); }}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Fecha Hasta</label>
                  <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, hasta: e.target.value })); setPage(1); }}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Turno</label>
                  <select
                    value={filtros.turno}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, turno: e.target.value })); setPage(1); }}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
                  >
                    <option value="">Todos los Turnos</option>
                    <option value="MAÑANA">☀️ Turno Mañana</option>
                    <option value="TARDE">🌙 Turno Tarde</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Municipio</label>
                  <select
                    value={filtros.municipio}
                    onChange={(e) => { setFiltros((prev) => ({ ...prev, municipio: e.target.value })); setPage(1); }}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
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
                  label="Total Instituciones Reportadas"
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
                  label="Tasa de Asistencia Global"
                  value={`${stats.pct_asistencia || 0}%`}
                  subtext="Rendimiento"
                  color="amber"
                />
              </div>
            )}

            {/* Gráficos Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras: Asistencia por Municipio */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📍</span> Asistencia Estudiantil por Municipio
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={municipiosData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="municipio" tick={{ fontSize: 10, fill: '#64748B' }} angle={-35} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="matricula_asistente" name="Asistentes" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="matricula_inasistente" name="Inasistentes" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Líneas: Tendencia Temporal */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📈</span> Tendencia Diaria de Participación
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="asistente" name="Est. Asistentes" stroke="#1E3A8A" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="inasistente" name="Est. Inasistentes" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabla Detallada con Paginación */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>📑</span> Registros Detallados de Asistencia ({totalReportes})
                </h3>
                <span className="text-xs text-slate-500">Ordenados por hora de registro</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-blue-950 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Turno</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Municipio</th>
                      <th className="px-4 py-3">Institución</th>
                      <th className="px-4 py-3">Director(a)</th>
                      <th className="px-4 py-3 text-center">Est. Asist.</th>
                      <th className="px-4 py-3 text-center">Est. Inasist.</th>
                      <th className="px-4 py-3 text-center">Hora Registro</th>
                      <th className="px-4 py-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
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
