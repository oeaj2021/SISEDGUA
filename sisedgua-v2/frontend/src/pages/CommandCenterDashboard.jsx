import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Utensils, FileText, Filter, Calendar } from 'lucide-react';
import TacticalMetricCard from '../components/TacticalMetricCard';
import PulsingBeacon from '../components/PulsingBeacon';
import AgentDiagnosticsPanel from '../components/AgentDiagnosticsPanel';

const GUARICO_MUNICIPIOS = [
  'TODOS', 'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

export default function CommandCenterDashboard() {
  const [turno, setTurno] = useState('TODOS');
  const [municipio, setMunicipio] = useState('TODOS');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [stats, setStats] = useState({
    total_reportes: 142,
    estudiantes_asistente: 28450,
    estudiantes_inasistente: 3120,
    pct_asistencia: '90.12',
    docentes_asistente: 1890,
    docentes_inasistente: 85,
    cocina_asistente: 410,
    cocina_inasistente: 12
  });

  const handleRunDiagnostics = async () => {
    // Simulación o llamada al endpoint de agentes
    return {
      timestamp: new Date().toLocaleTimeString(),
      overallStatus: 'SYSTEM_STABLE',
      agents: {
        audit: {
          summary: '142 reportes analizados. 0 duplicados encontrados. Asistencia promedio normal (90.12%).'
        }
      }
    };
  };

  return (
    <div className="min-h-screen bg-zonal-navy text-slate-100 p-6 md:p-10 space-y-8">
      {/* Top Bar / Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src="/cde-guarico-logo.png"
            alt="CDCE Guárico"
            className="h-12 w-auto object-contain filter drop-shadow-md"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                SISEDGUA <span className="text-guarico-gold font-mono text-sm px-2 py-0.5 rounded-lg bg-guarico-gold/15">v2.0 HUD</span>
              </h1>
              <PulsingBeacon active={true} label="SALA SITUACIONAL GUÁRICO" />
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Zona Educativa Guárico — Monitoreo de Matrícula y Soberanía Alimentaria Escolar
            </p>
          </div>
        </div>

        {/* Tactical Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Turno */}
          <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
            {['TODOS', 'MAÑANA', 'TARDE'].map((t) => (
              <button
                key={t}
                onClick={() => setTurno(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  turno === t
                    ? 'bg-guarico-gold text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Selector de Municipio */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Filter size={14} className="text-guarico-gold" />
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-white text-xs cursor-pointer"
            >
              {GUARICO_MUNICIPIOS.map((m) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Calendar size={14} className="text-cyber-cyan" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-white text-xs cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TacticalMetricCard
          title="Total Reportes"
          value={stats.total_reportes}
          subtitle="Planteles reportados hoy"
          icon={FileText}
          accent="gold"
          badge="15 Municipios"
        />

        <TacticalMetricCard
          title="Matrícula Presente"
          value={stats.estudiantes_asistente}
          subtitle={`${stats.pct_asistencia}% Asistencia General`}
          icon={Users}
          accent="emerald"
          badge="Tiempo Real"
        />

        <TacticalMetricCard
          title="Docentes en Aula"
          value={stats.docentes_asistente}
          subtitle={`${stats.docentes_inasistente} inasistentes`}
          icon={GraduationCap}
          accent="cyan"
        />

        <TacticalMetricCard
          title="Cocineras CNAE"
          value={stats.cocina_asistente}
          subtitle="Garantía de comedor activo"
          icon={Utensils}
          accent="gold"
          badge="CNAE Activo"
        />
      </section>

      {/* Panel de Subagentes Autónomos */}
      <section>
        <AgentDiagnosticsPanel onTriggerDiagnostics={handleRunDiagnostics} />
      </section>

      {/* Mapeo Territorial Resumido */}
      <section className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="font-semibold text-white tracking-wide mb-4 flex items-center justify-between">
          <span>Distribución Territorial por Municipio</span>
          <span className="text-xs font-mono text-guarico-gold">15 de 15 Municipios</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {GUARICO_MUNICIPIOS.filter(m => m !== 'TODOS').map((mun) => (
            <div
              key={mun}
              className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <span className="text-[11px] font-mono text-slate-400 block truncate">{mun}</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-white font-mono">92%</span>
                <span className="h-1.5 w-1.5 rounded-full bg-bio-emerald"></span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
