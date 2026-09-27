import React, { useState, useEffect, useCallback } from 'react';
import {
  getPadron,
  createPadronManual,
  uploadPadronMasivo,
  deletePadron,
  getPadronStats
} from '../services/api';
import { MUNICIPIOS_GUARICO } from '../utils/guaricoData';

const TIPOS_PERSONAL = [
  'Docente',
  'Directivo',
  'Administrativo',
  'Obrero',
  'Cocinera de la Patria',
  'Supervisor / Enlace',
  'Otro'
];

export default function GestionPadron() {
  const [modo, setModo] = useState('lista'); // 'lista' | 'individual' | 'masivo'
  const [padron, setPadron] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros de búsqueda
  const [search, setSearch] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [tipoPersonal, setTipoPersonal] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Formulario Individual
  const [formIndividual, setFormIndividual] = useState({
    nacionalidad: 'V',
    cedula: '',
    nombres_apellidos: '',
    tipo_personal: 'Docente',
    municipio: ''
  });
  const [submittingIndividual, setSubmittingIndividual] = useState(false);
  const [msgIndividual, setMsgIndividual] = useState(null);

  // Formulario Masivo
  const [rawTextMasivo, setRawTextMasivo] = useState('');
  const [submittingMasivo, setSubmittingMasivo] = useState(false);
  const [msgMasivo, setMsgMasivo] = useState(null);

  const fetchPadron = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPadron({
        page,
        limit: 15,
        search,
        municipio,
        tipo_personal: tipoPersonal
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const total = Array.isArray(res.data) ? res.data.length : (res.data?.total ?? data.length);
      const pages = res.data?.totalPages || Math.ceil(total / 15) || 1;
      setPadron(data);
      setTotalPages(pages);
      setTotalCount(total);
    } catch (err) {
      console.error('Error al listar padrón:', err);
      setError(err.response?.data?.error || 'Error al conectar con la base de datos del padrón institucional.');
    } finally {
      setLoading(false);
    }
  }, [page, search, municipio, tipoPersonal]);

  const fetchStats = async () => {
    try {
      const res = await getPadronStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error al cargar stats padrón:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPadron();
  }, [fetchPadron]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setMsgIndividual(null);
    setSubmittingIndividual(true);
    try {
      const res = await createPadronManual(formIndividual);
      setMsgIndividual({ type: 'success', text: res.data.message || 'Personal guardado con éxito.' });
      setFormIndividual({
        nacionalidad: 'V',
        cedula: '',
        nombres_apellidos: '',
        tipo_personal: 'Docente',
        municipio: ''
      });
      fetchPadron();
      fetchStats();
    } catch (err) {
      setMsgIndividual({
        type: 'error',
        text: err.response?.data?.error || 'Error al registrar personal en el padrón.'
      });
    } finally {
      setSubmittingIndividual(false);
    }
  };

  const handleMasivoSubmit = async (e) => {
    e.preventDefault();
    setMsgMasivo(null);
    setSubmittingMasivo(true);
    try {
      const res = await uploadPadronMasivo({ rawText: rawTextMasivo });
      setMsgMasivo({ type: 'success', text: res.data.message });
      setRawTextMasivo('');
      fetchPadron();
      fetchStats();
    } catch (err) {
      setMsgMasivo({
        type: 'error',
        text: err.response?.data?.error || 'Error al procesar la carga masiva.'
      });
    } finally {
      setSubmittingMasivo(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar a ${nombre} del padrón?`)) return;
    try {
      await deletePadron(id);
      fetchPadron();
      fetchStats();
    } catch (err) {
      alert('Error al eliminar registro: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Subcabecera de Navegación de Padrón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1.5">
            <span>🏛️</span>
            Sala Situacional CDCE ESTADAL GUÁRICO
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>📋</span> Padrón Institucional del Personal Educativo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Base de datos para el autocompletado y validación de funcionarios en los formularios de SISEDGUA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModo('lista')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              modo === 'lista'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Listado ({totalCount})
          </button>
          <button
            onClick={() => setModo('individual')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              modo === 'individual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ➕ Cargar Uno
          </button>
          <button
            onClick={() => setModo('masivo')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              modo === 'masivo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ⚡ Carga Masiva
          </button>
        </div>
      </div>

      {/* KPI Stats del Padrón */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total en Padrón
            </span>
            <p className="text-2xl font-black text-blue-900 mt-1">{stats.total || 0}</p>
            <span className="text-[10px] text-slate-400">Personal Cargado</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Docentes
            </span>
            <p className="text-2xl font-black text-indigo-700 mt-1">
              {stats.porTipo?.find((t) => t.tipo_personal === 'Docente')?.total || 0}
            </p>
            <span className="text-[10px] text-slate-400">En aula y directivos</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cocineras / Obreros
            </span>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {Number(stats.porTipo?.find((t) => t.tipo_personal === 'Cocinera de la Patria')?.total || 0) +
                Number(stats.porTipo?.find((t) => t.tipo_personal === 'Obrero')?.total || 0)}
            </p>
            <span className="text-[10px] text-slate-400">Personal de apoyo</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Municipios con Carga
            </span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {stats.porMunicipio ? stats.porMunicipio.length : 0} / 15
            </p>
            <span className="text-[10px] text-slate-400">Distribución territorial</span>
          </div>
        </div>
      )}

      {/* MODO 1: CARGA INDIVIDUAL */}
      {modo === 'individual' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Registrar Personal al Padrón Institucional
          </h3>

          {msgIndividual && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                msgIndividual.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {msgIndividual.text}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nac. *
                </label>
                <select
                  value={formIndividual.nacionalidad}
                  onChange={(e) =>
                    setFormIndividual((prev) => ({ ...prev, nacionalidad: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Número de Cédula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 14567890"
                  maxLength={9}
                  value={formIndividual.cedula}
                  onChange={(e) =>
                    setFormIndividual((prev) => ({
                      ...prev,
                      cedula: e.target.value.replace(/\D/g, '')
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nombres y Apellidos *
              </label>
              <input
                type="text"
                required
                placeholder="Nombre completo del funcionario"
                value={formIndividual.nombres_apellidos}
                onChange={(e) =>
                  setFormIndividual((prev) => ({ ...prev, nombres_apellidos: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo de Personal *
                </label>
                <select
                  value={formIndividual.tipo_personal}
                  onChange={(e) =>
                    setFormIndividual((prev) => ({ ...prev, tipo_personal: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_PERSONAL.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Municipio (Opcional)
                </label>
                <select
                  value={formIndividual.municipio}
                  onChange={(e) =>
                    setFormIndividual((prev) => ({ ...prev, municipio: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione si aplica...</option>
                  {Object.entries(MUNICIPIOS_GUARICO).map(([key, m]) => (
                    <option key={key} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModo('lista')}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingIndividual}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:bg-blue-300"
              >
                {submittingIndividual ? 'Guardando...' : 'Guardar en Padrón'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODO 2: CARGA MASIVA */}
      {modo === 'masivo' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-2">
            Carga Masiva de Cédulas y Nombres al Padrón
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Copie y pegue filas desde Excel o archivos CSV. El sistema detectará las columnas
            automáticamente.
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900">
            <span className="font-bold">Formato por línea:</span> CÉDULA, NOMBRES Y APELLIDOS, TIPO
            PERSONAL, MUNICIPIO (separados por comas o tabuladores).
            <div className="mt-1 font-mono text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded">
              V-18456123, María Rodríguez, Docente, Roscio
              <br />
              15678432, Carlos Gómez, Obrero, Ortiz
              <br />
              V20456789, Juana Morales, Cocinera de la Patria, Miranda
            </div>
          </div>

          {msgMasivo && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                msgMasivo.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {msgMasivo.text}
            </div>
          )}

          <form onSubmit={handleMasivoSubmit} className="space-y-4">
            <textarea
              required
              rows={8}
              value={rawTextMasivo}
              onChange={(e) => setRawTextMasivo(e.target.value)}
              placeholder="Pegue aquí el listado de funcionarios..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {rawTextMasivo.split('\n').filter((l) => l.trim().length > 0).length} líneas ingresadas
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModo('lista')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingMasivo || !rawTextMasivo.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:bg-emerald-300 cursor-pointer"
                >
                  {submittingMasivo ? 'Procesando Carga...' : '⚡ Procesar Carga Masiva'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODO LISTA: BUSCADOR Y TABLA */}
      {modo === 'lista' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Buscar por Cédula o Nombre
              </label>
              <input
                type="text"
                placeholder="Ej: 14567890 o María..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Municipio
              </label>
              <select
                value={municipio}
                onChange={(e) => {
                  setMunicipio(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los municipios</option>
                {Object.entries(MUNICIPIOS_GUARICO).map(([key, m]) => (
                  <option key={key} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de Personal
              </label>
              <select
                value={tipoPersonal}
                onChange={(e) => {
                  setTipoPersonal(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                {TIPOS_PERSONAL.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
              <span className="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{error}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  fetchPadron();
                  fetchStats();
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Subcabecera Tabla Padrón */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-500">
              Registros en lista: <strong className="text-slate-900">{padron.length}</strong> de <strong className="text-slate-900">{totalCount}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                fetchPadron();
                fetchStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Actualizar Padrón</span>
            </button>
          </div>

          {/* Tabla Padrón */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Cédula</th>
                  <th className="px-4 py-3">Nombres y Apellidos</th>
                  <th className="px-4 py-3">Tipo Personal</th>
                  <th className="px-4 py-3">Municipio</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      Cargando padrón...
                    </td>
                  </tr>
                ) : padron.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No hay registros en el padrón con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  padron.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                        {p.nacionalidad}-{p.cedula}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {p.nombres_apellidos}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                          {p.tipo_personal || 'Docente'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.municipio || 'N/A'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(p.id, p.nombres_apellidos)}
                          className="text-red-500 hover:text-red-700 font-bold text-[11px] px-2 py-1 rounded hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-300 text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-300 text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
