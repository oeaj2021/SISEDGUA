import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getConteoHoy } from '../services/api';
import { getTurnoActivo } from '../utils/horario';

export default function ConteoMunicipiosBar() {
  const location = useLocation();

  // Determinar turno inicial según la ruta activa o la hora oficial de Venezuela
  const getTurnoInicial = () => {
    if (location.pathname === '/tarde') return 'TARDE';
    if (location.pathname === '/manana') return 'MAÑANA';
    return getTurnoActivo() || 'MAÑANA';
  };

  const [turnoSeleccionado, setTurnoSeleccionado] = useState(getTurnoInicial);

  const [dataConteo, setDataConteo] = useState({
    fecha: '',
    total_general: 0,
    total_manana: 0,
    total_tarde: 0,
    por_municipio: []
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Estados para drag con mouse
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // Sincronizar automáticamente si el usuario navega entre /manana y /tarde
  useEffect(() => {
    if (location.pathname === '/tarde') {
      setTurnoSeleccionado('TARDE');
    } else if (location.pathname === '/manana') {
      setTurnoSeleccionado('MAÑANA');
    }
  }, [location.pathname]);

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
    // Auto-actualizar cada 60 segundos
    const timer = setInterval(() => {
      if (!document.hidden) {
        cargarConteo();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollPosition();
      el.addEventListener('scroll', checkScrollPosition, { passive: true });
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        el.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [dataConteo]);

  // Total numérico según turno seleccionado
  const totalActivo =
    turnoSeleccionado === 'MAÑANA'
      ? dataConteo.total_manana || 0
      : turnoSeleccionado === 'TARDE'
      ? dataConteo.total_tarde || 0
      : dataConteo.total_general || 0;

  return (
    <div className="bg-slate-950 border-b border-blue-900/60 text-white select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex flex-col md:flex-row items-center gap-2">
        {/* Indicador General y Selector de Turno */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 whitespace-nowrap">
              {turnoSeleccionado === 'MAÑANA'
                ? 'Reportes Mañana:'
                : turnoSeleccionado === 'TARDE'
                ? 'Reportes Tarde:'
                : 'Registrados Hoy:'}
            </span>
            <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full font-mono shadow-sm">
              {cargando ? '...' : `${totalActivo} Planteles`}
            </span>
          </div>

          {/* Selector de Turno por Píldoras */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setTurnoSeleccionado('MAÑANA')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                turnoSeleccionado === 'MAÑANA'
                  ? 'bg-amber-400 text-blue-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Filtrar conteo por Turno Mañana"
            >
              <span>☀️</span>
              <span>Mañana ({dataConteo.total_manana || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTurnoSeleccionado('TARDE')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                turnoSeleccionado === 'TARDE'
                  ? 'bg-sky-400 text-blue-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Filtrar conteo por Turno Tarde"
            >
              <span>🌙</span>
              <span>Tarde ({dataConteo.total_tarde || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTurnoSeleccionado('TODOS')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                turnoSeleccionado === 'TODOS'
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver total acumulado del día"
            >
              <span>📋</span>
              <span>Total ({dataConteo.total_general || 0})</span>
            </button>
          </div>
        </div>

        {/* Contenedor con Scroll Horizontal y Botones de Navegación */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center gap-1">
          {/* Botón Scroll Izquierda */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Desplazar a la izquierda"
            className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-blue-700 hover:text-white transition-all shrink-0 z-10 cursor-pointer ${
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
              {dataConteo.por_municipio && dataConteo.por_municipio.length > 0 ? (
                dataConteo.por_municipio.map((item) => {
                  const valorConteo =
                    turnoSeleccionado === 'MAÑANA'
                      ? item.manana
                      : turnoSeleccionado === 'TARDE'
                      ? item.tarde
                      : item.total;
                  const tieneReportes = valorConteo > 0;

                  return (
                    <div
                      key={item.municipio}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs transition-all shadow-sm ${
                        tieneReportes
                          ? turnoSeleccionado === 'TARDE'
                            ? 'bg-gradient-to-r from-sky-950/90 to-blue-900/90 border-sky-500/80 text-white font-semibold'
                            : 'bg-gradient-to-r from-blue-900/90 to-blue-800/90 border-blue-500/80 text-white font-semibold'
                          : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                      title={`${item.municipio}: ${item.manana} en Mañana | ${item.tarde} en Tarde (Total: ${item.total})`}
                    >
                      <span className="uppercase tracking-tight text-[10px] font-bold text-slate-200">
                        {item.municipio}
                      </span>
                      <span
                        className={`font-mono font-black px-1.5 py-0.5 rounded text-[11px] ${
                          tieneReportes
                            ? turnoSeleccionado === 'TARDE'
                              ? 'bg-sky-400 text-blue-950 shadow-inner'
                              : 'bg-emerald-400 text-slate-950 shadow-inner'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.total_instituciones ? `${valorConteo}/${item.total_instituciones}` : valorConteo}
                      </span>
                      {turnoSeleccionado === 'TODOS' && tieneReportes && (
                        <span className="text-[9px] text-blue-200 font-mono tracking-tighter">
                          ({item.manana}M/{item.tarde}T)
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 italic py-0.5">
                  {cargando ? 'Cargando conteo por municipio...' : 'Esperando primeros reportes del día'}
                </span>
              )}
            </div>
          </div>

          {/* Botón Scroll Derecha */}
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Desplazar a la derecha"
            className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 border border-slate-700 text-slate-200 hover:bg-blue-700 hover:text-white transition-all shrink-0 z-10 cursor-pointer ${
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
