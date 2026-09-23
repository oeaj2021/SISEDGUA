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
      <div className="min-h-screen bg-mesh-blue flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-100 p-8 sm:p-10 max-w-md w-full text-center relative z-10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-4xl mx-auto mb-4 border border-blue-100 shadow-inner">
            ✓
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block mb-1">
            Recepción Exitosa
          </span>
          <h2 className="text-2xl font-black text-slate-900 mb-2">¡Reporte Registrado!</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            El informe diario de asistencia para el <strong>Turno {turno}</strong> ha sido transmitido y archivado de manera conforme en la plataforma oficial SISEDGUA.
          </p>
          <button
            onClick={() => setEnviadoExitoso(false)}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"
          >
            Registrar Otro Reporte
          </button>
        </div>
      </div>
    );
  }

  const esManana = turno === 'MAÑANA';

  return (
    <div className="min-h-screen bg-mesh-blue py-8 sm:py-12 px-4 relative overflow-hidden">
      {/* Luces sutiles dinámicas en el fondo */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Cabecera Institucional con Degradado Azul y Acentos Blancos */}
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white rounded-t-3xl p-6 sm:p-10 shadow-xl border-x border-t border-blue-500/30 text-center relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <span className="inline-block text-[11px] font-black tracking-widest text-sky-300 uppercase px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 mb-3">
            República Bolivariana de Venezuela · MPPE
          </span>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            ZONA EDUCATIVA DEL ESTADO GUÁRICO
          </h1>

          <p className="text-blue-100/90 text-xs sm:text-sm mt-1.5 font-medium max-w-xl mx-auto">
            Sistema Integrado de Seguimiento y Estadísticas Diarias · Período 2026-2027
          </p>

          <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-blue-950 shadow-md">
              {esManana ? '☀️ TURNO DE LA MAÑANA' : '🌙 TURNO DE LA TARDE'}
            </span>
            <span className="text-xs font-semibold text-blue-200 bg-blue-950/70 border border-blue-600/40 px-3 py-1 rounded-full">
              Horario Legal: {esManana ? '07:00 AM - 12:00 PM' : '01:00 PM - 10:00 PM'}
            </span>
          </div>
        </div>

        {/* Cuerpo del Formulario en Blanco Puro con Acentos Azules */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-3xl shadow-2xl shadow-blue-950/10 border-x border-b border-blue-100 p-6 sm:p-10 space-y-7">
          {/* Municipio */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-blue-600">📍</span> MUNICIPIO(S) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
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
                    className={`text-xs font-bold py-2.5 px-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                      activo
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-900'
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
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="text-blue-600">📅</span> FECHA DEL REPORTE <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
              onBlur={verificarDuplicidad}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 font-medium transition"
            />
          </div>

          {/* Datos del Director */}
          <div className="border-t border-slate-100 pt-7">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">👤</span> Identificación del Director(a) o Responsable
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Nombres y Apellidos del Director(a) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Elena Rodríguez Méndez"
                  value={form.nombre_director}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre_director: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Cédula de Identidad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-14.234.567"
                  value={form.cedula}
                  onChange={(e) => setForm((prev) => ({ ...prev, cedula: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Número Telefónico <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0414-1234567"
                  value={form.telefono}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 transition"
                />
              </div>
            </div>
          </div>

          {/* Institución Educativa */}
          <div className="border-t border-slate-100 pt-7">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">🏫</span> Institución Educativa
            </h3>
            <InstitucionSelector
              municipiosSeleccionados={form.municipio}
              value={form.nombre_institucion}
              onChange={handleInstitucionChange}
            />
          </div>

          {/* Alerta de Duplicado */}
          {duplicadoDetectado && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-amber-950">Aviso de Posible Duplicidad</p>
                <p className="mt-0.5 text-amber-800">Ya se encuentra registrado un reporte de asistencia para esta institución en la fecha y turno seleccionados. Si se trata de una corrección oficial, puede continuar.</p>
              </div>
            </div>
          )}

          {/* Cuadro de Cifras de Asistencia */}
          <div className="border-t border-slate-100 pt-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">📊</span> Cifras de Asistencia — Turno {turno}
              </h3>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Oficial
              </span>
            </div>

            <div className="space-y-4">
              {/* Matrícula Estudiantil - Destacada */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-blue-50/80 p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎒</span> Matrícula Estudiantil
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total: {(form.matricula_asistente + form.matricula_inasistente).toLocaleString('es-VE')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <label className="block text-[11px] font-black text-blue-900 mb-1.5 uppercase">
                      Asistentes <span className="text-emerald-500 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_asistente}
                      onChange={handleNumeroChange('matricula_asistente')}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-base text-center font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <label className="block text-[11px] font-black text-slate-700 mb-1.5 uppercase">
                      Inasistentes <span className="text-rose-500 font-bold">●</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.matricula_inasistente}
                      onChange={handleNumeroChange('matricula_inasistente')}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-base text-center font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Docente, Administrativo, Obrero y Cocina */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  ['Docentes', 'docentes_asistente', 'docentes_inasistente', '👨‍🏫'],
                  ['Administrativo', 'admin_asistente', 'admin_inasistente', '💼'],
                  ['Obreros', 'obrero_asistente', 'obrero_inasistente', '🔧'],
                  ['Cocineras(os) de la Patria', 'cocina_asistente', 'cocina_inasistente', '🍲']
                ].map(([titulo, asistKey, inasistKey, emoji]) => (
                  <div key={titulo} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition">
                    <span className="text-[11px] font-black text-slate-800 uppercase block mb-2.5 flex items-center gap-1.5">
                      <span>{emoji}</span> Personal {titulo}
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">Asistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[asistKey]}
                          onChange={handleNumeroChange(asistKey)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-center font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Inasistentes</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={form[inasistKey]}
                          onChange={handleNumeroChange(inasistKey)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm text-center font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidencias */}
          <div className="border-t border-slate-100 pt-7">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="text-blue-600">📝</span> INCIDENCIAS / OBSERVACIONES DEL DÍA <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder='Indique las novedades presentadas en el plantel o escriba: "Sin novedades / Jornada Normal"'
              value={form.incidencias}
              onChange={(e) => setForm((prev) => ({ ...prev, incidencias: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 bg-slate-50/50 focus:bg-white text-slate-800 transition leading-relaxed"
            />
          </div>

          {/* Error */}
          {mensajeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 shadow-sm">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold">{mensajeError}</span>
            </div>
          )}

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2.5 text-base disabled:opacity-50 cursor-pointer"
          >
            {cargando ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>Procesando y Guardando Reporte...</span>
              </>
            ) : (
              <>
                <span className="text-xl">📤</span>
                <span>Enviar Reporte Oficial</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
