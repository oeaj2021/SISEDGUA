import React, { useState, useEffect } from 'react';
import { submitReporte, checkDuplicado } from '../services/api';
import FormBlockedScreen from './FormBlockedScreen';
import InstitucionSelector from './InstitucionSelector';
import { HORARIOS, validarHorarioTurno } from '../utils/horario';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

const estadoInicial = {
  municipio: [],
  fecha: new Date().toISOString().split('T')[0],
  nombre_director: '',
  cedula: '',
  telefono: '',
  nombre_institucion: '',
  institucion_id: null,
  matricula_asistente: 0,
  matricula_inasistente: 0,
  docentes_asistente: 0,
  docentes_inasistente: 0,
  admin_asistente: 0,
  admin_inasistente: 0,
  obrero_asistente: 0,
  obrero_inasistente: 0,
  cocina_asistente: 0,
  cocina_inasistente: 0,
  incidencias: ''
};

export default function FormReporte({ turno }) {
  const [dentroDeHorario, setDentroDeHorario] = useState(() => validarHorarioTurno(turno));
  const [form, setForm] = useState(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [duplicadoDetectado, setDuplicadoDetectado] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDentroDeHorario(validarHorarioTurno(turno));
    }, 15000);
    return () => clearInterval(interval);
  }, [turno]);

  if (!dentroDeHorario) {
    const h = HORARIOS[turno];
    return <FormBlockedScreen turno={turno} horaApertura={h.inicio} horaCierre={h.fin} />;
  }

  const handleMunicipioToggle = (mun) => {
    setForm((prev) => {
      const existe = prev.municipio.includes(mun);
      const nuevo = existe ? prev.municipio.filter((m) => m !== mun) : [...prev.municipio, mun];
      return {
        ...prev,
        municipio: nuevo,
        nombre_institucion: '',
        institucion_id: null
      };
    });
  };

  const handleInstitucionChange = (nombre, id) => {
    setForm((prev) => ({
      ...prev,
      nombre_institucion: nombre,
      institucion_id: id
    }));
  };

  const verificarDuplicidad = async () => {
    if (!form.nombre_institucion || !form.fecha) return;
    try {
      const res = await checkDuplicado({
        nombre_institucion: form.nombre_institucion,
        fecha: form.fecha,
        turno
      });
      setDuplicadoDetectado(res.data?.duplicado || false);
    } catch (err) {
      console.warn('No se pudo verificar duplicado:', err);
    }
  };

  const handleNumeroChange = (campo) => (e) => {
    const val = parseInt(e.target.value, 10);
    setForm((prev) => ({
      ...prev,
      [campo]: isNaN(val) ? 0 : Math.max(0, val)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError('');

    if (form.municipio.length === 0) {
      setMensajeError('Debe seleccionar al menos un municipio.');
      return;
    }

    if (!form.nombre_institucion.trim()) {
      setMensajeError('Debe ingresar o seleccionar el nombre de la institución educativa.');
      return;
    }

    setCargando(true);
    try {
      await submitReporte({
        ...form,
        turno
      });
      setEnviadoExitoso(true);
      setForm(estadoInicial);
      setDuplicadoDetectado(false);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data?.error === 'FUERA_DE_HORARIO') {
        setDentroDeHorario(false);
      } else {
        setMensajeError(data?.error || 'Error al enviar el reporte. Verifique su conexión y reintente.');
      }
    } finally {
      setCargando(false);
    }
  };

  if (enviadoExitoso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-200">
            ✓
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Recepción Conforme
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Reporte Registrado!</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            El informe diario de asistencia para el <strong>Turno {turno}</strong> ha sido recibido y archivado de manera exitosa en SISEDGUA.
          </p>
          <button
            onClick={() => setEnviadoExitoso(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            Registrar Otro Reporte
          </button>
        </div>
      </div>
    );
  }

  const esManana = turno === 'MAÑANA';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Cabecera Institucional Limpia */}
        <div className="bg-white text-slate-800 rounded-t-2xl p-6 sm:p-8 border border-slate-200 text-center shadow-xs">
          <span className="inline-block text-[11px] font-semibold tracking-wider text-blue-700 uppercase px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
            República Bolivariana de Venezuela · MPPE
          </span>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            CENTRO DESARROLLO DE LA CALIDAD EDUCATIVA GUÁRICO
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Reporte Diario de Asistencia Escolar · Período 2026-2027
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              esManana
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-sky-50 text-sky-900 border border-sky-200'
            }`}>
              {esManana ? '☀️ Turno de la Mañana' : '🌙 Turno de la Tarde'}
            </span>
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg font-medium">
              Horario: {esManana ? '07:00 AM - 12:00 PM' : '01:00 PM - 10:00 PM'}
            </span>
          </div>
        </div>

        {/* Formulario en Blanco con Bordes Limpios */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Municipio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📍</span> MUNICIPIO(S) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {form.municipio.length > 0 ? `${form.municipio.length} seleccionado(s)` : 'Seleccione al menos uno'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MUNICIPIOS.map((mun) => {
                const activo = form.municipio.includes(mun);
                return (
                  <button
                    key={mun}
                    type="button"
                    onClick={() => handleMunicipioToggle(mun)}
                    className={`text-xs font-medium py-2 px-3 rounded-lg border text-center transition-colors cursor-pointer ${
                      activo
                        ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {activo ? '✓ ' : ''}{mun}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              FECHA DEL REPORTE <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
              onBlur={verificarDuplicidad}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white text-slate-800"
            />
          </div>

          {/* Datos del Director */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>👤</span> Identificación del Director(a) o Responsable
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Nombres y Apellidos del Director(a) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Elena Rodríguez Méndez"
                  value={form.nombre_director}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre_director: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Cédula de Identidad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-14.234.567"
                  value={form.cedula}
                  onChange={(e) => setForm((prev) => ({ ...prev, cedula: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Número Telefónico <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0414-1234567"
                  value={form.telefono}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Institución Educativa */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>🏫</span> Institución Educativa
            </h3>
            <InstitucionSelector
              municipiosSeleccionados={form.municipio}
              value={form.nombre_institucion}
              onChange={handleInstitucionChange}
            />
          </div>

          {/* Alerta de Duplicado */}
          {duplicadoDetectado && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-bold">Aviso de Posible Duplicidad</p>
                <p className="mt-0.5">Ya se encuentra registrado un reporte de asistencia para esta institución en la fecha y turno seleccionados. Si se trata de una corrección, puede continuar.</p>
              </div>
            </div>
          )}

          {/* Cuadro de Cifras de Asistencia con colores pasteles por rol */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>📊</span> Cifras de Asistencia — Turno {turno}
            </h3>

            <div className="space-y-4">
              {/* Estudiantes (Pastel Sky) */}
              <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                    Matrícula Estudiantil
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total: {(form.matricula_asistente + form.matricula_inasistente).toLocaleString('es-VE')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Asistentes <span className="text-emerald-600 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_asistente}
                      onChange={handleNumeroChange('matricula_asistente')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Inasistentes <span className="text-rose-600 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_inasistente}
                      onChange={handleNumeroChange('matricula_inasistente')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Docente, Administrativo, Obrero y Cocina en cuadrícula limpia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Docentes', 'docentes_asistente', 'docentes_inasistente', 'bg-indigo-50/50 border-indigo-100'],
                  ['Administrativo', 'admin_asistente', 'admin_inasistente', 'bg-purple-50/50 border-purple-100'],
                  ['Obreros', 'obrero_asistente', 'obrero_inasistente', 'bg-amber-50/50 border-amber-100'],
                  ['Cocineras(os) de la Patria', 'cocina_asistente', 'cocina_inasistente', 'bg-emerald-50/50 border-emerald-100']
                ].map(([titulo, asistKey, inasistKey, colorClase]) => (
                  <div key={titulo} className={`p-3.5 rounded-xl border ${colorClase}`}>
                    <span className="text-[11px] font-bold text-slate-800 uppercase block mb-2">
                      Personal {titulo}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Asistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[asistKey]}
                          onChange={handleNumeroChange(asistKey)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Inasistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[inasistKey]}
                          onChange={handleNumeroChange(inasistKey)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidencias */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              INCIDENCIAS / OBSERVACIONES DEL DÍA <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder='Indique las novedades presentadas en el plantel o escriba: "Sin novedades / Jornada Normal"'
              value={form.incidencias}
              onChange={(e) => setForm((prev) => ({ ...prev, incidencias: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 bg-white"
            />
          </div>

          {/* Error */}
          {mensajeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-medium">{mensajeError}</span>
            </div>
          )}

          {/* Botón de Enviar Sobrio y Profesional */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
          >
            {cargando ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>Procesando Reporte...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Enviar Reporte Oficial</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
