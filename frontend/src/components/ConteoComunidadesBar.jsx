import React, { useEffect, useState, useRef } from 'react';
import { getConsejosComunalesStats } from '../services/api';

const MUNICIPIOS_ORDENADOS = [
  { id: 'ROSCIO', nombre: 'ROSCIO' },
  { id: 'INFANTE', nombre: 'INFANTE' },
  { id: 'MIRANDA', nombre: 'MIRANDA' },
  { id: 'ZARAZA', nombre: 'ZARAZA' },
  { id: 'MONAGAS', nombre: 'MONAGAS' },
  { id: 'MELLADO', nombre: 'MELLADO' },
  { id: 'RIBAS', nombre: 'RIBAS' },
  { id: 'RONDON', nombre: 'RONDÓN' },
  { id: 'EL SOCORRO', nombre: 'EL SOCORRO' },
  {
    id: 'SANTA MARIA DE IPIRE',
    nombre: 'SANTA MARÍA DE IPIRE',
    alias: ['SANTA MARIA', 'SANTA MARIA DE IPIRE', 'SANTA MARÍA', 'SANTA MARÍA DE IPIRE']
  },
  { id: 'CHAGUARAMAS', nombre: 'CHAGUARAMAS' },
  { id: 'GUAYABAL', nombre: 'GUAYABAL' },
  { id: 'GUARIBE', nombre: 'GUARIBE' },
  { id: 'CAMAGUAN', nombre: 'CAMAGUÁN' },
  { id: 'ORTIZ', nombre: 'ORTIZ' }
];

export default function ConteoComunidadesBar() {
  const [dataConteo, setDataConteo] = useState({
    totalRegistros: 0,
    porMunicipio: []
  });
  const [cargando, setCargando] = useState(true);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Estados para drag con mouse
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const cargarConteo = async () => {
    try {
      const res = await getConsejosComunalesStats();
      if (res.data) {
        const rawList = Array.isArray(res.data.porMunicipio) ? res.data.porMunicipio : [];
        const mapa = {};
        rawList.forEach((item) => {
          const m = (item.municipio || '').toUpperCase().trim();
          mapa[m] = (mapa[m] || 0) + (parseInt(item.total, 10) || 0);
        });

        // Sumar todas las variantes posibles de Santa María de Ipire
        const totalSantaMaria =
          (mapa['SANTA MARIA DE IPIRE'] || 0) +
          (mapa['SANTA MARIA'] || 0) +
          (mapa['SANTA MARÍA DE IPIRE'] || 0) +
          (mapa['SANTA MARÍA'] || 0);

        const listado = MUNICIPIOS_ORDENADOS.map((item) => {
          let tot = mapa[item.id] || 0;
          if (item.id === 'SANTA MARIA DE IPIRE' || item.id === 'SANTA MARIA') {
            tot = totalSantaMaria;
          } else if (item.alias && Array.isArray(item.alias)) {
            tot = item.alias.reduce((acc, k) => acc + (mapa[k] || 0), 0);
          }
          return {
            municipio: item.nombre,
            id: item.id,
            total: tot
          };
        });

        setDataConteo({
          totalRegistros: res.data.totalRegistros || 0,
          porMunicipio: listado
        });
      }
    } catch (err) {
      console.warn('No se pudo cargar el conteo de comunidades:', err);
    } finally {
      setCargando(false);
    }
  };

  const checkScrollPosition = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      const offset = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleWheel = (e) => {
    const el = scrollContainerRef.current;
    if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    cargarConteo();
    const timer = setInterval(() => {
      if (!document.hidden) {
        cargarConteo();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [dataConteo]);

  return (
    <div className="bg-slate-950/95 border-b border-indigo-900/60 text-white select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex flex-col md:flex-row items-center gap-2">
        {/* Indicador General de Comunidades */}
        <div className="flex items-center gap-2 shrink-0 py-0.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 whitespace-nowrap">
            Registros Comunales:
          </span>
          <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full font-mono shadow-sm">
            {cargando ? '...' : `${dataConteo.totalRegistros} Registrados`}
          </span>
        </div>

        {/* Contenedor con Scroll Horizontal y Botones de Navegación */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center gap-1">
          {/* Botón Scroll Izquierda */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Desplazar a la izquierda"
            className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-indigo-700 hover:text-white transition-all shrink-0 z-10 cursor-pointer ${
              !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100 shadow'
            }`}
          >
            ‹
          </button>

          {/* Carrusel Horizontal de Municipios */}
          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 overflow-x-auto municipios-scrollbar py-1 cursor-grab active:cursor-grabbing scroll-smooth"
          >
            <div className="flex items-center gap-2 min-w-max px-1">
              {dataConteo.porMunicipio && dataConteo.porMunicipio.length > 0 ? (
                dataConteo.porMunicipio.map((item) => {
                  const tieneRegistros = item.total > 0;

                  return (
                    <div
                      key={item.id || item.municipio}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs transition-all shadow-sm ${
                        tieneRegistros
                          ? 'bg-gradient-to-r from-indigo-950/90 to-blue-900/90 border-indigo-500/80 text-white font-semibold'
                          : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                      title={`${item.municipio}: ${item.total} registros de participación comunal`}
                    >
                      <span className="uppercase tracking-tight text-[10px] font-bold text-slate-200">
                        {item.municipio}
                      </span>
                      <span
                        className={`font-mono font-black px-1.5 py-0.5 rounded text-[11px] ${
                          tieneRegistros
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cargando ? '...' : item.total}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 py-0.5">
                  Cargando consolidado comunal por municipio...
                </div>
              )}
            </div>
          </div>

          {/* Botón Scroll Derecha */}
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Desplazar a la derecha"
            className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-indigo-700 hover:text-white transition-all shrink-0 z-10 cursor-pointer ${
              !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100 shadow'
            }`}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
