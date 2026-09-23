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
    <div className="bg-slate-950 border-b border-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Resumen Principal */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Registrados Hoy:
          </span>
          <span className="bg-blue-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
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
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                      tieneReportes
                        ? 'bg-blue-800 border-blue-600 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                    title={`${item.municipio}: ${item.total} reportados hoy (${item.manana} Mañana / ${item.tarde} Tarde)`}
                  >
                    <span className="uppercase tracking-tight text-[10px]">
                      {item.municipio}:
                    </span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded text-[11px] ${
                        tieneReportes
                          ? 'bg-white text-blue-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.total}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">
                {cargando ? 'Cargando conteo por municipio...' : 'Esperando primeros reportes del día'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
