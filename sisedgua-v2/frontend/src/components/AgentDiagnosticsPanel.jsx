import React, { useState } from 'react';
import { Bot, ShieldCheck, Activity, MapPin, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AgentDiagnosticsPanel({ agents = [], onTriggerDiagnostics }) {
  const [isRunning, setIsRunning] = useState(false);
  const [latestReport, setLatestReport] = useState(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      if (onTriggerDiagnostics) {
        const report = await onTriggerDiagnostics();
        setLatestReport(report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-guarico-gold/15 text-guarico-gold">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-wide">
              Ecosistema de Subagentes Autónomos
            </h3>
            <p className="text-xs text-slate-400">
              Auditoría estadística, cobertura territorial y telemetría de base de datos
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-guarico-gold text-slate-950 hover:bg-amber-400 transition shadow-gold-glow active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Ejecutando Agentes...' : 'Disparar Auditoría'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agente 1 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <ShieldCheck size={20} className="text-bio-emerald mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">AuditIntegrityGuardian</h4>
            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-bio-emerald/20 text-bio-emerald font-semibold">
              LISTO • AUDITORÍA 0 DUP
            </span>
            <p className="mt-2 text-[11px] text-slate-400">
              Vigila saltos anómalos de matrícula y ratios de asistencia.
            </p>
          </div>
        </div>

        {/* Agente 2 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <MapPin size={20} className="text-cyber-cyan mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">TerritorialGeoAnalyst</h4>
            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyber-cyan/20 text-cyber-cyan font-semibold">
              15 MUNICIPIOS ACTIVOS
            </span>
            <p className="mt-2 text-[11px] text-slate-400">
              Mapea cobertura y detecta silencio parroquial en Guárico.
            </p>
          </div>
        </div>

        {/* Agente 3 */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <Activity size={20} className="text-guarico-gold mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">DatabasePerformanceAgent</h4>
            <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-guarico-gold/20 text-guarico-gold font-semibold">
              SQL PUSH-DOWN OK
            </span>
            <p className="mt-2 text-[11px] text-slate-400">
              Supervisa latencias p95 y efectividad de índices compuestos.
            </p>
          </div>
        </div>
      </div>

      {latestReport && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-2 mb-2 text-bio-emerald font-semibold">
            <CheckCircle2 size={16} />
            <span>Diagnóstico completado ({latestReport.timestamp})</span>
          </div>
          <p className="text-slate-300">
            Estado Global: <strong className="text-guarico-gold">{latestReport.overallStatus}</strong>
          </p>
          <p className="text-slate-400 text-[11px] mt-1">
            Resumen: {latestReport.agents?.audit?.summary}
          </p>
        </div>
      )}
    </div>
  );
}
