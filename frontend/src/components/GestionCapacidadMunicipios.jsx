import React, { useState, useEffect } from 'react';
import {
  getCapacidadesMunicipio,
  saveCapacidadMunicipio,
  inicializarCapacidadesMunicipio
} from '../services/api';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

export default function GestionCapacidadMunicipios() {
  const [capacidades, setCapacidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState('MAÑANA');
  const [busqueda, setBusqueda] = useState('');

  // Edición rápida o Modal
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    municipio: 'ROSCIO',
    turno: 'MAÑANA',
    max_matricula: 0,
    max_docentes: 0,
    max_administrativo: 0,
    max_obreros: 0,
    max_cocineros: 0
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await getCapacidadesMunicipio({ turno: filtroTurno });
      setCapacidades(res.data || []);
    } catch (err) {
      console.error('Error al cargar capacidades:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroTurno]);

  const handleEditar = (c) => {
    setMunicipioSeleccionado(c.municipio);
    setFormData({
      municipio: c.municipio,
      turno: c.turno,
      max_matricula: c.max_matricula || 0,
      max_docentes: c.max_docentes || 0,
      max_administrativo: c.max_administrativo || 0,
      max_obreros: c.max_obreros || 0,
      max_cocineros: c.max_cocineros || 0
    });
    setMensaje(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      await saveCapacidadMunicipio(formData);
      setMensaje({ tipo: 'exito', texto: `Capacidad de ${formData.municipio} (${formData.turno}) guardada con éxito.` });
      setTimeout(() => {
        setMunicipioSeleccionado(null);
        cargarDatos();
      }, 700);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar la capacidad municipal.' });
    } finally {
      setGuardando(false);
    }
  };

  const handleInicializar = async () => {
    if (!window.confirm('¿Desea inicializar todos los 15 municipios con los turnos mañana y tarde?')) {
      return;
    }
    setCargando(true);
    try {
      await inicializarCapacidadesMunicipio();
      cargarDatos();
    } catch (err) {
      alert('Error al inicializar municipios.');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar municipios por búsqueda
  const listaFiltrada = capacidades.filter((c) =>
    c.municipio.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Totales consolidados del turno seleccionado
  const totalMatricula = capacidades.reduce((acc, c) => acc + (c.max_matricula || 0), 0);
  const totalDocentes = capacidades.reduce((acc, c) => acc + (c.max_docentes || 0), 0);
  const totalAdministrativos = capacidades.reduce((acc, c) => acc + (c.max_administrativo || 0), 0);
  const totalObreros = capacidades.reduce((acc, c) => acc + (c.max_obreros || 0), 0);
  const totalCocineros = capacidades.reduce((acc, c) => acc + (c.max_cocineros || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumen Totalizador por Turno para el Estado Guárico */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🏛️</span> Capacidad Máxima Global del Estado Guárico
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cifras oficiales censadas de matrícula y personal por municipio para el Turno {filtroTurno}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroTurno('MAÑANA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                filtroTurno === 'MAÑANA'
                  ? 'bg-amber-400 text-blue-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ☀️ Turno Mañana
            </button>
            <button
              onClick={() => setFiltroTurno('TARDE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                filtroTurno === 'TARDE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌙 Turno Tarde
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-900 uppercase block">Matrícula Total</span>
            <span className="text-xl font-black text-blue-950 mt-1 block">
              {totalMatricula.toLocaleString('es-VE')}
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-900 uppercase block">Docentes</span>
            <span className="text-xl font-black text-emerald-950 mt-1 block">
              {totalDocentes.toLocaleString('es-VE')}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Administrativo</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {totalAdministrativos.toLocaleString('es-VE')}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Obreros</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {totalObreros.toLocaleString('es-VE')}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Cocineras(os)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {totalCocineros.toLocaleString('es-VE')}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Control */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar municipio (ej. Roscio, Infante, Miranda)..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none w-64"
        />

        <div className="flex items-center gap-2">
          {capacidades.length < 15 && (
            <button
              type="button"
              onClick={handleInicializar}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-lg transition cursor-pointer"
            >
              ⚙️ Inicializar 15 Municipios
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Matrícula Máxima por Municipio */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-blue-950 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3 text-center">Matrícula Máxima</th>
                <th className="px-4 py-3 text-center">Docentes Máximos</th>
                <th className="px-4 py-3 text-center">Administrativo Máx.</th>
                <th className="px-4 py-3 text-center">Obreros Máx.</th>
                <th className="px-4 py-3 text-center">Cocineros Máx.</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {listaFiltrada.length > 0 ? (
                listaFiltrada.map((item) => (
                  <tr key={`${item.municipio}-${item.turno}`} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span>📍</span> {item.municipio}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.turno === 'MAÑANA' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {item.turno}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-900 text-sm">
                      {(item.max_matricula || 0).toLocaleString('es-VE')}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-800 text-sm">
                      {(item.max_docentes || 0).toLocaleString('es-VE')}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 font-semibold">
                      {(item.max_administrativo || 0).toLocaleString('es-VE')}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 font-semibold">
                      {(item.max_obreros || 0).toLocaleString('es-VE')}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 font-semibold">
                      {(item.max_cocineros || 0).toLocaleString('es-VE')}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEditar(item)}
                        className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Establecer Máximos
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    {cargando ? 'Cargando datos municipales...' : 'No hay datos cargados para este turno. Pulsa "Inicializar 15 Municipios".'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Editar Capacidad del Municipio */}
      {municipioSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  📍 {formData.municipio}
                </h3>
                <span className="text-xs text-slate-500">
                  Definir capacidades máximas para el Turno {formData.turno}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMunicipioSeleccionado(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Matrícula Estudiantil Máxima *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.max_matricula}
                  onChange={(e) => setFormData({ ...formData, max_matricula: parseInt(e.target.value, 10) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Cantidad Máxima de Docentes *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.max_docentes}
                  onChange={(e) => setFormData({ ...formData, max_docentes: parseInt(e.target.value, 10) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Admin. Máx.</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_administrativo}
                    onChange={(e) => setFormData({ ...formData, max_administrativo: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Obreros Máx.</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_obreros}
                    onChange={(e) => setFormData({ ...formData, max_obreros: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cocineras Máx.</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_cocineros}
                    onChange={(e) => setFormData({ ...formData, max_cocineros: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>

              {mensaje && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {mensaje.texto}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMunicipioSeleccionado(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Capacidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
