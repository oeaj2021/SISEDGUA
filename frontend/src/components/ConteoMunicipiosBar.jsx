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
    const timer = setInterval(cargarConteo, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 border-b border-blue-500/20 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Resumen Principal */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-200">
            Registrados Hoy:
          </span>
          <span className="bg-white text-blue-950 text-xs font-black px-3 py-0.5 rounded-full shadow-sm font-mono tracking-tight">
            {cargando ? '...' : `${dataConteo.total_general} Instituciones`}
          </span>
        </div>

        {/* Listado Horizontal con scroll suave de los 15 municipios */}
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 min-w-max text-[11px]">
            {dataConteo.por_municipio && dataConteo.por_municipio.length > 0 ? (
              dataConteo.por_municipio.map((item) => {
                const tieneReportes = item.total > 0;
                return (
                  <div
                    key={item.municipio}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all duration-200 ${
                      tieneReportes
                        ? 'bg-blue-600/90 border-blue-400 text-white font-bold shadow-sm shadow-blue-500/25 scale-[1.02]'
                        : 'bg-blue-950/40 border-blue-900/40 text-blue-300/70 hover:border-blue-700/60'
                    }`}
                    title={`${item.municipio}: ${item.total} reportados hoy (${item.manana} Mañana / ${item.tarde} Tarde)`}
                  >
                    <span className="uppercase tracking-tight text-[10px] font-semibold">
                      {item.municipio}:
                    </span>
                    <span
                      className={`font-mono font-black px-1.5 py-0.2 rounded text-[11px] ${
                        tieneReportes
                          ? 'bg-white text-blue-900 shadow-sm'
                          : 'bg-blue-900/60 text-blue-200'
                      }`}
                    >
                      {item.total}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-blue-300/70 italic">
                {cargando ? 'Cargando conteo por municipio...' : 'Esperando primeros reportes del día'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
