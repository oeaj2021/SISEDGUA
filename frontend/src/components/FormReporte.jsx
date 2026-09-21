import React, { useState, useEffect } from 'react';
import { submitReporte, checkDuplicado } from '../services/api';
import FormBlockedScreen from './FormBlockedScreen';
import InstitucionSelector from './InstitucionSelector';

const MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

const HORARIOS = {
  MAÑANA: { inicio: 7, fin: 12 },
  TARDE:  { inicio: 13, fin: 22 }
};

function getHoraVenezuelaDecimal() {
  const ve = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  return ve.getHours() + ve.getMinutes() / 60;
}

function validarHorarioTurno(turno) {
  // Flag opcional en localStorage para pruebas locales si se requiere
  if (localStorage.getItem('SISEDGUA_BYPASS_SCHEDULE') === 'true') {
    return true;
  }
  const config = HORARIOS[turno];
  if (!config) return true;
  const hora = getHoraVenezuelaDecimal();
  return hora >= config.inicio && hora < config.fin;
}

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
      setMensajeError('Por favor seleccione al menos un municipio.');
      return;
    }

    if (!form.nombre_institucion || form.nombre_institucion.trim() === '') {
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Reporte Registrado!</h2>
          <p className="text-slate-600 text-sm mb-6">
            El informe diario de asistencia para el <strong>Turno {turno}</strong> ha sido recibido y archivado de manera conforme en la plataforma SISEDGUA.
          </p>
          <button
            onClick={() => setEnviadoExitoso(false)}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm transition"
          >
            Registrar Otro Reporte
          </button>
        </div>
      </div>
    );
  }

  const esManana = turno === 'MAÑANA';

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Cabecera Institucional */}
        <div className="bg-blue-950 text-white rounded-t-2xl p-6 sm:p-8 shadow-md text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-900/40 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase block mb-1">
            República Bolivariana de Venezuela · MPPE
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            ZONA EDUCATIVA DEL ESTADO GUÁRICO
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm mt-1">
            Reporte Diario de Asistencia Escolar · Período 2026-2027
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              esManana ? 'bg-amber-400 text-blue-950' : 'bg-indigo-400 text-slate-950'
            }`}>
              {esManana ? '☀️ TURNO DE LA MAÑANA' : '🌙 TURNO DE LA TARDE'}
            </span>
            <span className="text-xs text-blue-300">
              ({esManana ? '07:00 AM - 12:00 PM' : '01:00 PM - 10:00 PM'})
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-lg border-x border-b border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Municipio */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              MUNICIPIO <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MUNICIPIOS.map((mun) => {
                const activo = form.municipio.includes(mun);
                return (
                  <button
                    key={mun}
                    type="button"
                    onClick={() => handleMunicipioToggle(mun)}
                    className={`text-xs font-bold py-2 px-3 rounded-lg border text-center transition-all ${
                      activo
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              FECHA DEL REPORTE <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
              onBlur={verificarDuplicidad}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
            />
          </div>

          {/* Datos del Director */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>👤</span> Identificación del Director(a) o Responsable
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Nombres y Apellidos del Director(a) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Elena Rodríguez Méndez"
                  value={form.nombre_director}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre_director: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Cédula de Identidad <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-14.234.567"
                  value={form.cedula}
                  onChange={(e) => setForm((prev) => ({ ...prev, cedula: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Número Telefónico <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0414-1234567"
                  value={form.telefono}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Institución Educativa */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
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
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-xs text-amber-900 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-bold">Aviso de Posible Duplicidad</p>
                <p>Ya se encuentra registrado un reporte de asistencia para esta institución en la fecha y turno seleccionados. Si se trata de una corrección, puede continuar.</p>
              </div>
            </div>
          )}

          {/* Cuadro de Cifras de Asistencia */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>📊</span> Cifras de Asistencia — Turno {turno}
            </h3>

            <div className="space-y-4">
              {/* Estudiantes */}
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-950 uppercase block mb-2">
                  Matrícula Estudiantil
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Asistentes <span className="text-emerald-700 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_asistente}
                      onChange={handleNumeroChange('matricula_asistente')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Inasistentes <span className="text-rose-600 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_inasistente}
                      onChange={handleNumeroChange('matricula_inasistente')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Docente, Administrativo, Obrero y Cocina */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Docentes', 'docentes_asistente', 'docentes_inasistente'],
                  ['Administrativo', 'admin_asistente', 'admin_inasistente'],
                  ['Obreros', 'obrero_asistente', 'obrero_inasistente'],
                  ['Cocineras(os) de la Patria', 'cocina_asistente', 'cocina_inasistente']
                ].map(([titulo, asistKey, inasistKey]) => (
                  <div key={titulo} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
                      Personal {titulo}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Asistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[asistKey]}
                          onChange={handleNumeroChange(asistKey)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-center font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Inasistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[inasistKey]}
                          onChange={handleNumeroChange(inasistKey)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-center font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              INCIDENCIAS / OBSERVACIONES DEL DÍA <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder='Indique las novedades presentadas o escriba: "Sin novedades / Jornada Normal"'
              value={form.incidencias}
              onChange={(e) => setForm((prev) => ({ ...prev, incidencias: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          {/* Error */}
          {mensajeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{mensajeError}</span>
            </div>
          )}

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
          >
            {cargando ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>Procesando y Guardando Reporte...</span>
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
