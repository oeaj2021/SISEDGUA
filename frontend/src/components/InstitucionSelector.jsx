import React, { useState, useEffect } from 'react';
import { getInstituciones } from '../services/api';

/**
 * Selector de institución con precarga dinámica por municipio.
 * Si el usuario no encuentra la suya, puede activar el modo manual para escribirla.
 */
export default function InstitucionSelector({ municipiosSeleccionados, value, onChange }) {
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState(value || '');
  const [modoManual, setModoManual] = useState(false);
  const [textoManual, setTextoManual] = useState(value || '');
  const [selectedId, setSelectedId] = useState(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  useEffect(() => {
    if (!municipiosSeleccionados || municipiosSeleccionados.length === 0) {
      setInstituciones([]);
      setSelectedId(null);
      return;
    }

    setLoading(true);
    const primerMunicipio = municipiosSeleccionados[0];
    getInstituciones({ municipio: primerMunicipio })
      .then((res) => {
        setInstituciones(res.data || []);
      })
      .catch((err) => {
        console.error('Error cargando instituciones:', err);
        setInstituciones([]);
      })
      .finally(() => setLoading(false));
  }, [municipiosSeleccionados]);

  const filtradas = instituciones.filter((i) =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.codigo && i.codigo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleSelect = (inst) => {
    setSelectedId(inst.id);
    setBusqueda(inst.nombre);
    setMostrarDropdown(false);
    onChange(inst.nombre, inst.id);
  };

  const handleActivarManual = () => {
    setModoManual(true);
    setSelectedId(null);
    setBusqueda('');
    onChange(textoManual, null);
  };

  const handleVolverSelector = () => {
    setModoManual(false);
    setTextoManual('');
    onChange('', null);
  };

  const inputClass = "w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white transition";

  if (!municipiosSeleccionados || municipiosSeleccionados.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
        <span>📍</span>
        <span>Primero debe seleccionar el <strong>Municipio</strong> para desplegar las instituciones correspondientes.</span>
      </div>
    );
  }

  if (modoManual) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span>✏️</span> Escribiendo institución no registrada en el catálogo
          </span>
          <button
            type="button"
            onClick={handleVolverSelector}
            className="text-blue-700 hover:text-blue-900 font-bold underline"
          >
            Volver a la lista
          </button>
        </div>
        <input
          type="text"
          required
          placeholder="Escriba aquí el Nombre Oficial Completo de la Institución Educativa..."
          value={textoManual}
          onChange={(e) => {
            setTextoManual(e.target.value);
            onChange(e.target.value, null);
          }}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <input
          type="text"
          required
          placeholder={loading ? 'Cargando catálogo escolar...' : `Escriba para buscar o seleccionar la institución...`}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setSelectedId(null);
            setMostrarDropdown(true);
            onChange(e.target.value, null);
          }}
          onFocus={() => setMostrarDropdown(true)}
          className={inputClass}
          disabled={loading}
        />
        {selectedId && (
          <span className="absolute right-3 top-2.5 text-emerald-600 font-bold text-sm flex items-center gap-1">
            ✓ Catálogo
          </span>
        )}
      </div>

      {mostrarDropdown && busqueda && !selectedId && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto mt-1">
          {filtradas.length > 0 ? (
            filtradas.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => handleSelect(inst)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
              >
                <span className="font-medium text-slate-800">{inst.nombre}</span>
                {inst.codigo && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {inst.codigo}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-500">
              No se encontró ninguna institución con ese nombre en {municipiosSeleccionados[0]}.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          {instituciones.length} instituciones registradas en este municipio
        </span>
        <button
          type="button"
          onClick={handleActivarManual}
          className="text-xs text-blue-800 hover:text-blue-900 font-semibold underline flex items-center gap-1"
        >
          <span>➕</span> ¿No encuentras tu institución? Llénala manualmente
        </button>
      </div>
    </div>
  );
}
