import React, { useEffect, useState } from 'react';
import { getConteoHoy } from '../services/api';

export default function ConteoMunicipiosBar() {
  const [dataConteo, setDataConteo] = useState({
    fecha: '',
    total_general: 0,
    por_municipio: []
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargarConteo = async () => {
    try {
      const res = await getConteoHoy();
      if (res.data) {
        setDataConteo(res.data);
        setError(false);
      }
    } catch (err) {
      console.warn('No se pudo cargar el conteo de municipios:', err);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConteo();
    // Auto-actualizar cada 30 segundos para reflejar nuevos registros en tiempo real
    const timer = setInterval(cargarConteo, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Resumen Principal */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Registrados Hoy:
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-2.5 py-0.5 rounded-full font-mono">
            {cargando ? '...' : `${dataConteo.total_general} Instituciones`}
          </span>
        </div>

        {/* Listado Horizontal con scroll suave de los 15 municipios */}
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 min-w-max text-[11px]">
            {dataConteo.por_municipio && dataConteo.por_municipio.length > 0 ? (
              dataConteo.por_municipio.map((item) => {
                const tieneReportes = item.total > 0;
                return (
                  <div
                    key={item.municipio}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${
                      tieneReportes
                        ? 'bg-blue-950/80 border-blue-600/60 text-blue-200 font-semibold'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
                    }`}
                    title={`${item.municipio}: ${item.total} reportados hoy (${item.manana} Mañana / ${item.tarde} Tarde)`}
                  >
                    <span className="uppercase tracking-tight">{item.municipio}:</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        tieneReportes
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {item.total}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-slate-500 italic">
                {cargando ? 'Cargando conteo por municipio...' : 'Esperando primeros reportes del día'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
