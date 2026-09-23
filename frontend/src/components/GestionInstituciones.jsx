import React, { useState, useEffect } from 'react';
import {
  getInstituciones,
  createInstitucion,
  updateInstitucion,
  deleteInstitucion,
  deleteInstitucionesBatch,
  getCapacidadesMunicipios
} from '../services/api';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

const formVacio = {
  municipio: 'ROSCIO',
  nombre: '',
  codigo: '',
  turno: 'AMBOS',
  max_matricula: 0,
  max_docentes: 0,
  max_administrativo: 0,
  max_obreros: 0,
  max_cocineros: 0
};

export default function GestionInstituciones() {
  const [instituciones, setInstituciones] = useState([]);
  const [capacidades, setCapacidades] = useState([]);
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  // Selección múltiple de filas para eliminación
  const [seleccionados, setSeleccionados] = useState([]);
  const [eliminandoBatch, setEliminandoBatch] = useState(false);

  // Estado del Modal / Formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    setSeleccionados([]);
    try {
      const params = {};
      if (filtroMunicipio) params.municipio = filtroMunicipio;
      if (filtroTurno) params.turno = filtroTurno;
      if (busqueda) params.search = busqueda;

      const [resInst, resCap] = await Promise.all([
        getInstituciones(params),
        getCapacidadesMunicipios()
      ]);

      setInstituciones(resInst.data || []);
      setCapacidades(resCap.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroMunicipio, filtroTurno, busqueda]);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormData(formVacio);
    setMensaje(null);
    setMostrarModal(true);
  };

  const abrirEditar = (inst) => {
    setEditandoId(inst.id);
    setFormData({
      municipio: inst.municipio,
      nombre: inst.nombre,
      codigo: inst.codigo || '',
      turno: inst.turno || 'AMBOS',
      max_matricula: inst.max_matricula || 0,
      max_docentes: inst.max_docentes || 0,
      max_administrativo: inst.max_administrativo || 0,
      max_obreros: inst.max_obreros || 0,
      max_cocineros: inst.max_cocineros || 0
    });
    setMensaje(null);
    setMostrarModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      if (editandoId) {
        await updateInstitucion(editandoId, formData);
        setMensaje({ tipo: 'exito', texto: 'Institución actualizada correctamente.' });
      } else {
        await createInstitucion(formData);
        setMensaje({ tipo: 'exito', texto: 'Institución creada exitosamente.' });
      }
      setTimeout(() => {
        setMostrarModal(false);
        cargarDatos();
      }, 700);
    } catch (err) {
      console.error(err);
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.error || 'Error al guardar la institución.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar la institución "${nombre}"?`)) {
      return;
    }
    try {
      await deleteInstitucion(id);
      cargarDatos();
    } catch (err) {
      alert('Error al eliminar la institución.');
    }
  };

  // Manejo de Selección Múltiple
  const handleToggleFila = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTodos = () => {
    if (seleccionados.length === instituciones.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(instituciones.map((i) => i.id));
    }
  };

  const handleEliminarSeleccionados = async () => {
    if (seleccionados.length === 0) return;
    const confirmacion = window.confirm(
      `¿Está seguro de eliminar las ${seleccionados.length} instituciones seleccionadas? Esta acción no se puede deshacer.`
    );
    if (!confirmacion) return;

    setEliminandoBatch(true);
    try {
      await deleteInstitucionesBatch(seleccionados);
      cargarDatos();
    } catch (err) {
      alert('Error al eliminar las instituciones seleccionadas.');
    } finally {
      setEliminandoBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Capacidades Globales por Municipio */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>🏛️</span> Capacidad Máxima Censada por Municipio
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {capacidades.slice(0, 10).map((c) => (
            <div key={c.municipio} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-black text-blue-900 uppercase block truncate">
                {c.municipio}
              </span>
              <div className="mt-1 text-xs text-slate-700">
                <span className="font-bold text-slate-900">{c.total_instituciones}</span> planteles
              </div>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                <div>Matrícula: <strong className="text-slate-800">{c.max_matricula.toLocaleString('es-VE')}</strong></div>
                <div>Docentes: <strong className="text-slate-800">{c.max_docentes}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Control y Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o código DEA..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none w-56 sm:w-64"
          />

          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
          >
            <option value="">Todos los Municipios</option>
            {MUNICIPIOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none bg-slate-50"
          >
            <option value="">Todos los Turnos</option>
            <option value="MAÑANA">Mañana</option>
            <option value="TARDE">Tarde</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {seleccionados.length > 0 && (
            <button
              type="button"
              disabled={eliminandoBatch}
              onClick={handleEliminarSeleccionados}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 animate-pulse"
            >
              <span>🗑️</span>
              <span>
                {eliminandoBatch ? 'Eliminando...' : `Eliminar Seleccionados (${seleccionados.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={abrirCrear}
            className="bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span>
            <span>Nueva Institución</span>
          </button>
        </div>
      </div>

      {/* Tabla de Instituciones con Selección Múltiple */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={instituciones.length > 0 && seleccionados.length === instituciones.length}
                    onChange={handleToggleTodos}
                    className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer"
                    title="Seleccionar / Deseleccionar todos"
                  />
                </th>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3">Institución</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3 text-center">Máx. Matrícula</th>
                <th className="px-4 py-3 text-center">Máx. Docentes</th>
                <th className="px-4 py-3 text-center">Máx. Admin</th>
                <th className="px-4 py-3 text-center">Máx. Obreros</th>
                <th className="px-4 py-3 text-center">Máx. Cocina</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {instituciones.length > 0 ? (
                instituciones.map((inst) => {
                  const estaSeleccionado = seleccionados.includes(inst.id);
                  return (
                    <tr
                      key={inst.id}
                      className={`transition ${estaSeleccionado ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => handleToggleFila(inst.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{inst.municipio}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{inst.nombre}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{inst.codigo || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {inst.turno}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900">{inst.max_matricula || 0}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-800">{inst.max_docentes || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{inst.max_administrativo || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{inst.max_obreros || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{inst.max_cocineros || 0}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(inst)}
                          className="text-blue-700 hover:text-blue-900 font-bold underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(inst.id, inst.nombre)}
                          className="text-rose-600 hover:text-rose-800 font-bold underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    {cargando ? 'Cargando instituciones...' : 'No se encontraron instituciones registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editandoId ? '✏️ Editar Institución y Capacidades' : '➕ Registrar Nueva Institución'}
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Municipio *</label>
                  <select
                    required
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  >
                    {MUNICIPIOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Turno Habilitado</label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                  >
                    <option value="AMBOS">Mañana y Tarde (Ambos)</option>
                    <option value="MAÑANA">Solo Mañana</option>
                    <option value="TARDE">Solo Tarde</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre de la Institución *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. U.E. Nacional Simón Bolívar"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Código Dependencia / DEA</label>
                <input
                  type="text"
                  placeholder="Ej. OD-123456"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-900 outline-none font-mono"
                />
              </div>

              {/* Capacidad / Límites Máximos */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase block">
                  Capacidad Máxima Esperada (Turno / Plantel)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Matrícula</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_matricula}
                      onChange={(e) => setFormData({ ...formData, max_matricula: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Docentes</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_docentes}
                      onChange={(e) => setFormData({ ...formData, max_docentes: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Administrativos</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_administrativo}
                      onChange={(e) => setFormData({ ...formData, max_administrativo: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Obreros</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_obreros}
                      onChange={(e) => setFormData({ ...formData, max_obreros: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cocineras(os)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_cocineros}
                      onChange={(e) => setFormData({ ...formData, max_cocineros: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {mensaje && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {mensaje.texto}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : (editandoId ? 'Actualizar Plantel' : 'Crear Plantel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
