import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MUNICIPIOS_GUARICO, COMITES_CONSEJO_COMUNAL } from '../utils/guaricoData';
import { consejoComunalSchema } from '../schemas/consejoComunalSchema';
import { consultarPadron, getInstituciones } from '../services/api';

export default function RegistroConsejoComunal() {
  const INITIAL_STATE = {
    nacionalidad: 'V',
    cedula: '',
    nombres_apellidos: '',
    telefono: '',
    genero: '',
    edad: '',
    tipo_personal: '',
    tipo_personal_otro: '',
    institucion_educativa: '',
    municipio: '',
    parroquia: '',
    comunidad: '',
    circuito_comunal: '',
    comuna: '',
    participa_asambleas: null,
    forma_parte_comite: null,
    comite: '',
    comite_otro: ''
  };

  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [serverError, setServerError] = useState('');
  const [instituciones, setInstituciones] = useState([]);
  const [institucionesCargando, setInstitucionesCargando] = useState(false);
  const [modoManualInstitucion, setModoManualInstitucion] = useState(false);

  // Estados para autocompletado inteligente mediante Padrón Institucional
  const [cedulaBuscando, setCedulaBuscando] = useState(false);
  const [cedulaVerificada, setCedulaVerificada] = useState(null);

  // Cargar catálogo de instituciones activas (filtradas automáticamente por municipio)
  useEffect(() => {
    let isMounted = true;
    const fetchInstituciones = async () => {
      setInstitucionesCargando(true);
      try {
        const params = form.municipio ? { municipio: form.municipio } : {};
        const res = await getInstituciones(params);
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setInstituciones(list);
          if (list.length === 0 && form.municipio) {
            setModoManualInstitucion(true);
          }
        }
      } catch (err) {
        console.warn('Error al cargar catálogo de instituciones:', err.message);
      } finally {
        if (isMounted) {
          setInstitucionesCargando(false);
        }
      }
    };
    fetchInstituciones();
    return () => {
      isMounted = false;
    };
  }, [form.municipio]);

  useEffect(() => {
    const cleanCed = form.cedula.trim();
    if (cleanCed.length < 6) {
      setCedulaVerificada(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCedulaBuscando(true);
      try {
        const res = await consultarPadron(form.nacionalidad, cleanCed);
        if (res.data?.found && res.data?.persona) {
          const persona = res.data.persona;
          setForm((prev) => ({
            ...prev,
            nombres_apellidos: persona.nombres_apellidos || prev.nombres_apellidos,
            tipo_personal: persona.tipo_personal || prev.tipo_personal,
            municipio: persona.municipio || prev.municipio
          }));
          setCedulaVerificada({
            encontrado: true,
            nombre: persona.nombres_apellidos,
            tipo: persona.tipo_personal
          });
          setErrors((prev) => ({
            ...prev,
            nombres_apellidos: undefined,
            cedula: undefined
          }));
        } else {
          setCedulaVerificada({
            encontrado: false,
            mensaje: 'No registrado en padrón previo (ingreso manual habilitado)'
          });
        }
      } catch (err) {
        console.warn('Consulta de padrón:', err.message);
        setCedulaVerificada(null);
      } finally {
        setCedulaBuscando(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.cedula, form.nacionalidad]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'municipio') updated.parroquia = '';
      if (name === 'tipo_personal' && value !== 'Otro') updated.tipo_personal_otro = '';
      if (name === 'comite' && value !== 'Otro (especifique)') updated.comite_otro = '';
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBooleanChange = (name, value) => {
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'forma_parte_comite' && !value) {
        updated.comite = '';
        updated.comite_otro = '';
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validation = consejoComunalSchema.safeParse(form);
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.issues.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      // Desplazar al primer error en dispositivos móviles
      const firstErrorField = Object.keys(fieldErrors)[0];
      const elem = document.querySelector(`[name="${firstErrorField}"]`);
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    const payload = {
      nacionalidad: form.nacionalidad,
      cedula: form.cedula.trim(),
      nombres_apellidos: form.nombres_apellidos.trim(),
      telefono: form.telefono.trim(),
      genero: form.genero,
      edad: form.edad ? parseInt(form.edad, 10) : null,
      tipo_personal: {
        valor: form.tipo_personal,
        detalle: form.tipo_personal === 'Otro' ? form.tipo_personal_otro.trim() : null
      },
      institucion_educativa: form.institucion_educativa.trim(),
      municipio: form.municipio,
      parroquia: form.parroquia,
      comunidad: form.comunidad.trim(),
      circuito_comunal: form.circuito_comunal.trim() || null,
      comuna: form.comuna.trim() || null,
      participa_asambleas: form.participa_asambleas,
      forma_parte_comite: form.forma_parte_comite,
      comite: form.forma_parte_comite
        ? {
            valor: form.comite,
            detalle: form.comite === 'Otro (especifique)' ? form.comite_otro.trim() : null
          }
        : null
    };

    try {
      const res = await axios.post('/api/consejos-comunales', payload);
      setModalSuccess({
        ...payload,
        id: res.data?.registro?.id ? `REG-${String(res.data.registro.id).padStart(5, '0')}` : `REG-${Date.now().toString().slice(-6)}`
      });
      setForm(INITIAL_STATE);
      setErrors({});
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error de conexión con el servidor. Verifique su acceso a internet o intente nuevamente.';
      setServerError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const REGISTRO_CERRADO = true;

  if (REGISTRO_CERRADO) {
    return (
      <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Cabecera Oficial Institucional con Banner Translúcido */}
          <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800 mb-6 text-center text-white">
            <img
              src="/cde-guarico-banner.png"
              alt="Centro de Desarrollo de la Calidad Educativa Guárico"
              className="h-12 sm:h-16 w-auto mx-auto object-contain mb-4 filter drop-shadow-md"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/80 text-blue-100 text-xs font-bold rounded-full uppercase tracking-wider mb-3 border border-blue-700/60 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Sala Situacional CDCE ESTADAL GUÁRICO
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Sector Educativo Participa en Consejos Comunales
            </h1>
            <p className="mt-2 text-sm sm:text-base text-blue-200 max-w-xl mx-auto font-medium">
              Instrumento oficial de captación y vinculación del personal educativo en las estructuras del Poder Popular.
            </p>
          </header>

          {/* Tarjeta de Cierre Indefinido */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-center p-8 sm:p-12 mb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center text-red-600 mb-6 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-xs font-black rounded-full uppercase tracking-wider mb-4 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Proceso de Registro Concluido
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
              Registro Cerrado Indefinidamente
            </h2>

            <p className="text-slate-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-6 font-medium">
              El enlace oficial para el registro y captación del personal educativo en los Consejos Comunales ha finalizado su jornada y se encuentra cerrado indefinidamente por disposición de la <strong>Sala Situacional del CDCE Guárico</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 max-w-md mx-auto mb-8 text-left space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="text-base">🏛️</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Consolidación Estadal:</strong>
                  <span>Los datos recolectados se encuentran en fase de consolidación, análisis y auditoría.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">📊</span>
                <div>
                  <strong className="text-slate-900 block font-bold">Módulo de Auditoría y Métricas:</strong>
                  <span>El personal directivo y coordinadores pueden acceder a las estadísticas y registros consolidados.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                to="/consejos-comunales/registros"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <span>📊</span>
                <span>Consultar Registros (Admin)</span>
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition cursor-pointer"
              >
                <span>🏠</span>
                <span>Ir a SISEDGUA</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Cabecera Oficial Institucional con Banner Translúcido */}
        <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 rounded-2xl p-6 sm:p-8 shadow-md border border-blue-800 mb-6 text-center text-white">
          <img
            src="/cde-guarico-banner.png"
            alt="Centro de Desarrollo de la Calidad Educativa Guárico"
            className="h-12 sm:h-16 w-auto mx-auto object-contain mb-4 filter drop-shadow-md"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/80 text-blue-100 text-xs font-bold rounded-full uppercase tracking-wider mb-3 border border-blue-700/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Sala Situacional CDCE ESTADAL GUÁRICO
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Sector Educativo Participa en Consejos Comunales
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-200 max-w-xl mx-auto font-medium">
            Instrumento oficial de captación y vinculación del personal educativo en las estructuras del Poder Popular.
          </p>
        </header>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium flex items-center justify-between shadow-sm">
            <span>⚠️ {serverError}</span>
            <button
              type="button"
              onClick={() => setServerError('')}
              className="text-red-500 hover:text-red-800 text-lg font-bold px-2"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* SECCIÓN 1: DATOS PERSONALES Y LABORALES */}
          <section className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                1
              </span>
              <h2 className="text-lg font-bold text-slate-900">Datos Personales y Laborales</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cédula de Identidad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cédula de Identidad <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="nacionalidad"
                    value={form.nacionalidad}
                    onChange={handleChange}
                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="cedula"
                    placeholder="Ej: 18456789"
                    maxLength={8}
                    value={form.cedula}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm((prev) => ({ ...prev, cedula: val }));
                      if (errors.cedula) setErrors((prev) => ({ ...prev, cedula: undefined }));
                    }}
                    className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 font-semibold ${
                      errors.cedula ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.cedula && <p className="text-xs text-red-600 mt-1 font-medium">{errors.cedula}</p>}
                
                {/* Retroalimentación de Búsqueda y Autocompletado */}
                {cedulaBuscando && (
                  <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1.5 font-medium animate-pulse">
                    <span>🔄</span>
                    <span>Verificando cédula en el padrón institucional...</span>
                  </p>
                )}
                {!cedulaBuscando && cedulaVerificada?.encontrado && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <span className="text-emerald-600 text-sm">✅</span>
                    <span>
                      <strong>Verificado:</strong> {cedulaVerificada.nombre} ({cedulaVerificada.tipo}) — Datos autocompletados
                    </span>
                  </div>
                )}
                {!cedulaBuscando && cedulaVerificada?.encontrado === false && form.cedula.length >= 6 && (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                    <span>ℹ️</span>
                    <span>No figura en padrón previo. Por favor ingrese sus datos completos.</span>
                  </p>
                )}
              </div>

              {/* Teléfono de Contacto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Teléfono de Contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="telefono"
                  placeholder="04141234567"
                  maxLength={11}
                  value={form.telefono}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setForm((prev) => ({ ...prev, telefono: val }));
                    if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 font-semibold ${
                    errors.telefono ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.telefono && <p className="text-xs text-red-600 mt-1 font-medium">{errors.telefono}</p>}
              </div>

              {/* Nombres y Apellidos */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombres y Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombres_apellidos"
                  placeholder="Nombre y Apellido completo (solo letras)"
                  value={form.nombres_apellidos}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                    errors.nombres_apellidos ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.nombres_apellidos && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.nombres_apellidos}</p>
                )}
              </div>

              {/* Género */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Género <span className="text-red-500">*</span>
                </label>
                <select
                  name="genero"
                  value={form.genero}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 font-medium ${
                    errors.genero ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Seleccione su género --</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
                {errors.genero && <p className="text-xs text-red-600 mt-1 font-medium">{errors.genero}</p>}
              </div>

              {/* Edad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Edad (Años) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="edad"
                  min={15}
                  max={100}
                  placeholder="Ej: 38"
                  value={form.edad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 font-semibold ${
                    errors.edad ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.edad && <p className="text-xs text-red-600 mt-1 font-medium">{errors.edad}</p>}
              </div>

              {/* Tipo de Personal */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tipo de Personal (Nómina MPPE) <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_personal"
                  value={form.tipo_personal}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                    errors.tipo_personal ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Seleccione una opción --</option>
                  <option value="Docente">Docente</option>
                  <option value="Obrero">Obrero</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Cocinera(o) de la Patria">Cocinera(o) de la Patria</option>
                  <option value="Directivo / Supervisor">Directivo / Supervisor</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.tipo_personal && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.tipo_personal}</p>
                )}

                {/* Dinámico: Especifique tipo de personal */}
                {form.tipo_personal === 'Otro' && (
                  <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl transition-all duration-300">
                    <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                      Especifique Tipo de Personal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tipo_personal_otro"
                      placeholder="Ej: Auxiliar de Preescolar, Tutor CBIT, Facilitador"
                      value={form.tipo_personal_otro}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-slate-900 ${
                        errors.tipo_personal_otro ? 'border-red-500 focus:ring-red-200' : 'border-blue-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.tipo_personal_otro && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{errors.tipo_personal_otro}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Institución Educativa donde labora */}
              <div id="institucion-educativa-field" className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Institución Educativa donde labora <span className="text-red-500">*</span>
                  </label>
                  {form.municipio && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 shadow-sm">
                      <span>📍</span>
                      <span>Filtrado por: <strong>{MUNICIPIOS_GUARICO[form.municipio]?.nombre || form.municipio}</strong> ({instituciones.length} planteles)</span>
                    </span>
                  )}
                </div>

                {/* Si no ha seleccionado municipio aún en la sección de dirección, mostrar banner de vinculación */}
                {!form.municipio && (
                  <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>💡</span>
                      <span>Seleccione su <strong>Municipio en la Sección 2 (Dirección)</strong> para filtrar automáticamente las instituciones donde labora:</span>
                    </span>
                    <select
                      value={form.municipio}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({ ...prev, municipio: val, parroquia: '' }));
                        if (errors.municipio) setErrors((prev) => ({ ...prev, municipio: undefined }));
                      }}
                      className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="">-- Elegir Municipio ahora --</option>
                      {Object.entries(MUNICIPIOS_GUARICO).map(([key, data]) => (
                        <option key={key} value={key}>{data.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selector de instituciones cuando hay municipio seleccionado */}
                {form.municipio && !modoManualInstitucion && instituciones.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        name="institucion_educativa"
                        value={form.institucion_educativa}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__OTRA__') {
                            setModoManualInstitucion(true);
                            setForm((prev) => ({ ...prev, institucion_educativa: '' }));
                          } else {
                            setForm((prev) => ({ ...prev, institucion_educativa: val }));
                            if (errors.institucion_educativa) {
                              setErrors((prev) => ({ ...prev, institucion_educativa: undefined }));
                            }
                          }
                        }}
                        disabled={institucionesCargando}
                        className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 font-medium ${
                          errors.institucion_educativa ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">
                          {institucionesCargando
                            ? 'Cargando planteles de la zona...'
                            : `-- Seleccione la Institución Educativa (${instituciones.length} disponibles) --`}
                        </option>
                        {instituciones.map((inst) => (
                          <option key={inst.id} value={inst.nombre}>
                            {inst.codigo ? `${inst.codigo} - ${inst.nombre}` : inst.nombre}
                          </option>
                        ))}
                        <option value="__OTRA__">✏️ Otra institución (no listada / ingresar a mano)...</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setModoManualInstitucion(true)}
                        title="Escribir nombre manualmente"
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition whitespace-nowrap"
                      >
                        Ingreso manual
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="institucion_educativa"
                        list="instituciones-catalogo"
                        placeholder={
                          institucionesCargando
                            ? 'Filtrando instituciones...'
                            : form.municipio
                            ? `Ej: U.E. en ${MUNICIPIOS_GUARICO[form.municipio]?.nombre || form.municipio}...`
                            : 'Ej: U.E. República del Brasil...'
                        }
                        value={form.institucion_educativa}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                          errors.institucion_educativa ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                      {form.municipio && instituciones.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setModoManualInstitucion(false)}
                          className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition whitespace-nowrap"
                        >
                          Ver Lista ({instituciones.length})
                        </button>
                      )}
                    </div>
                    <datalist id="instituciones-catalogo">
                      {instituciones.map((inst) => (
                        <option key={inst.id} value={inst.nombre}>
                          {inst.codigo ? `${inst.codigo} - ${inst.nombre}` : inst.nombre} {inst.municipio ? `(${inst.municipio})` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>💡</span>
                  <span>
                    {form.municipio
                      ? `Mostrando planteles correspondientes a ${MUNICIPIOS_GUARICO[form.municipio]?.nombre || form.municipio}. Puede elegir de la lista o escribir a mano.`
                      : 'El catálogo de instituciones se filtrará automáticamente en cuanto seleccione su Municipio en la sección de dirección.'}
                  </span>
                </p>
                {errors.institucion_educativa && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.institucion_educativa}</p>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: UBICACIÓN GEOGRÁFICA Y COMUNITARIA */}
          <section className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                2
              </span>
              <h2 className="text-lg font-bold text-slate-900">Ubicación Geográfica y Comunitaria</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Municipio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                    errors.municipio ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Seleccione Municipio --</option>
                  {Object.entries(MUNICIPIOS_GUARICO).map(([key, data]) => (
                    <option key={key} value={key}>
                      {data.nombre}
                    </option>
                  ))}
                </select>
                {errors.municipio && <p className="text-xs text-red-600 mt-1 font-medium">{errors.municipio}</p>}
                {form.municipio && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-medium flex items-center justify-between gap-1 shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <span>✅</span>
                      <span>Filtrando <strong>{instituciones.length}</strong> planteles de {MUNICIPIOS_GUARICO[form.municipio]?.nombre || form.municipio} en sus datos laborales.</span>
                    </span>
                    <a
                      href="#institucion-educativa-field"
                      className="text-blue-700 underline font-bold hover:text-blue-900 shrink-0 ml-1"
                    >
                      Ver institución ↑
                    </a>
                  </div>
                )}
              </div>

              {/* Parroquia dependiente */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Parroquia <span className="text-red-500">*</span>
                </label>
                <select
                  name="parroquia"
                  value={form.parroquia}
                  onChange={handleChange}
                  disabled={!form.municipio}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.parroquia ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">{form.municipio ? '-- Seleccione Parroquia --' : 'Primero elija Municipio'}</option>
                  {form.municipio &&
                    MUNICIPIOS_GUARICO[form.municipio]?.parroquias.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
                {errors.parroquia && <p className="text-xs text-red-600 mt-1 font-medium">{errors.parroquia}</p>}
              </div>

              {/* Nombre de la Comunidad */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre de la Comunidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="comunidad"
                  placeholder="Ej: Sector Las Palmas, Calle 3 con Carrera 4"
                  value={form.comunidad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                    errors.comunidad ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {errors.comunidad && <p className="text-xs text-red-600 mt-1 font-medium">{errors.comunidad}</p>}
              </div>

              {/* Circuito Comunal (Opcional / No limitante) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Circuito Comunal <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="circuito_comunal"
                  placeholder="Ej: Circuito Electoral Comunal N° 05"
                  value={form.circuito_comunal}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Comuna (Opcional / No limitante) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Comuna <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="comuna"
                  placeholder="Ej: Comuna Socialista El Sombrero Unido"
                  value={form.comuna}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: PARTICIPACIÓN EN EL PODER POPULAR */}
          <section className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black">
                3
              </span>
              <h2 className="text-lg font-bold text-slate-900">Participación en el Poder Popular</h2>
            </div>

            <div className="space-y-6">
              {/* Radio 1: Participa en asambleas */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  ¿Pertenece o participa activamente en las asambleas del Consejo Comunal? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button
                      type="button"
                      key={String(val)}
                      onClick={() => handleBooleanChange('participa_asambleas', val)}
                      className={`p-3.5 rounded-xl border text-sm font-bold transition-all text-center flex items-center justify-center gap-2 ${
                        form.participa_asambleas === val
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.participa_asambleas === val ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
                      }`}>
                        {form.participa_asambleas === val && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                      {val ? 'Sí, participo' : 'No participo'}
                    </button>
                  ))}
                </div>
                {errors.participa_asambleas && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.participa_asambleas}</p>
                )}
              </div>

              {/* Radio 2: Forma parte de algún Comité */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  ¿Forma parte de algún Comité del Consejo Comunal? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button
                      type="button"
                      key={String(val)}
                      onClick={() => handleBooleanChange('forma_parte_comite', val)}
                      className={`p-3.5 rounded-xl border text-sm font-bold transition-all text-center flex items-center justify-center gap-2 ${
                        form.forma_parte_comite === val
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.forma_parte_comite === val ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
                      }`}>
                        {form.forma_parte_comite === val && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                      {val ? 'Sí' : 'No'}
                    </button>
                  ))}
                </div>
                {errors.forma_parte_comite && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.forma_parte_comite}</p>
                )}
              </div>

              {/* Desplegable Condicionado: Comités */}
              {form.forma_parte_comite === true && (
                <div className="pt-4 border-t border-slate-100 transition-all duration-300">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Comité al que pertenece (Ley Orgánica de los Consejos Comunales) <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="comite"
                    value={form.comite}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:bg-white text-slate-900 ${
                      errors.comite ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">-- Seleccione Comité o Vocería --</option>
                    {COMITES_CONSEJO_COMUNAL.map((comite) => (
                      <option key={comite} value={comite}>
                        {comite}
                      </option>
                    ))}
                  </select>
                  {errors.comite && <p className="text-xs text-red-600 mt-1 font-medium">{errors.comite}</p>}

                  {/* Dinámico: Especifique Comité */}
                  {form.comite === 'Otro (especifique)' && (
                    <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl transition-all duration-300">
                      <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                        Nombre del Comité / Vocería <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="comite_otro"
                        placeholder="Ej: Comité de Transporte Comunal, Mesa Técnica de Agua"
                        value={form.comite_otro}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 text-slate-900 ${
                          errors.comite_otro ? 'border-red-500 focus:ring-red-200' : 'border-blue-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.comite_otro && (
                        <p className="text-xs text-red-600 mt-1 font-medium">{errors.comite_otro}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Botón de Envío con Estado de Carga */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:bg-blue-400 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Enviando Registro Comunal...</span>
              </>
            ) : (
              <span>Registrar Participación en Consejo Comunal</span>
            )}
          </button>
        </form>

        {/* Modal de Confirmación Exitosa */}
        {modalSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                ✓
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 text-center">
                ¡Registro Completado con Éxito!
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1">
                Comprobante de Registro: <span className="font-mono font-bold text-slate-800">{modalSuccess.id}</span>
              </p>

              <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Cédula:</span>
                  <span className="font-semibold text-slate-900">{modalSuccess.nacionalidad}-{modalSuccess.cedula}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Nombres y Apellidos:</span>
                  <span className="font-semibold text-slate-900">{modalSuccess.nombres_apellidos}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Género / Edad:</span>
                  <span className="font-semibold text-slate-900">{modalSuccess.genero} · {modalSuccess.edad} años</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Tipo de Personal:</span>
                  <span className="font-semibold text-slate-900">
                    {modalSuccess.tipo_personal.valor}
                    {modalSuccess.tipo_personal.detalle ? ` (${modalSuccess.tipo_personal.detalle})` : ''}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Institución Educativa:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {modalSuccess.institucion_educativa}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Municipio / Parroquia:</span>
                  <span className="font-semibold text-slate-900">
                    {MUNICIPIOS_GUARICO[modalSuccess.municipio]?.nombre} — {modalSuccess.parroquia}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-500">Comunidad:</span>
                  <span className="font-semibold text-slate-900">{modalSuccess.comunidad}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="font-bold text-slate-500">Comité Asignado:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {modalSuccess.comite
                      ? `${modalSuccess.comite.valor}${modalSuccess.comite.detalle ? ` (${modalSuccess.comite.detalle})` : ''}`
                      : 'No pertenece a comité'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalSuccess(null)}
                className="mt-6 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Aceptar y Finalizar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
