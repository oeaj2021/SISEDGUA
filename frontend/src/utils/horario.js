/**
 * Utilidades de control de horario legal para la República Bolivariana de Venezuela (UTC-4 / America/Caracas).
 * Reglas oficiales:
 * - Turno MAÑANA: 07:00 a 11:00
 * - Turno TARDE:  12:00 a 19:00
 */

export const HORARIOS = {
  MAÑANA: {
    inicio: 7,
    fin: 11,
    path: '/manana',
    nombre: 'Mañana',
    aperturaTexto: '07:00 AM',
    cierreTexto: '11:00 AM'
  },
  TARDE: {
    inicio: 12,
    fin: 19,
    path: '/tarde',
    nombre: 'Tarde',
    aperturaTexto: '12:00 PM',
    cierreTexto: '07:00 PM'
  }
};

/**
 * Retorna un objeto Date con la hora actual correspondiente a America/Caracas.
 */
export function getFechaVenezuela() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
}

/**
 * Retorna la hora decimal actual en Venezuela (ej. 7.5 = 07:30 AM, 13.25 = 01:15 PM).
 */
export function getHoraVenezuelaDecimal() {
  const ve = getFechaVenezuela();
  return ve.getHours() + ve.getMinutes() / 60 + ve.getSeconds() / 3600;
}

/**
 * Formatea la hora actual de Venezuela en formato legible (ej. "08:45:12 AM").
 */
export function getHoraVenezuelaFormateada() {
  const ve = getFechaVenezuela();
  return ve.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Determina cuál turno está activo en este preciso momento.
 * Retorna 'MAÑANA', 'TARDE' o null si está en receso o fuera de horario.
 */
export function getTurnoActivo() {
  if (typeof window !== 'undefined' && localStorage.getItem('SISEDGUA_BYPASS_SCHEDULE') === 'true') {
    return null; // En modo bypass manual no forzamos restricción estricta
  }
  const hora = getHoraVenezuelaDecimal();
  if (hora >= HORARIOS.MAÑANA.inicio && hora < HORARIOS.MAÑANA.fin) {
    return 'MAÑANA';
  }
  if (hora >= HORARIOS.TARDE.inicio && hora < HORARIOS.TARDE.fin) {
    return 'TARDE';
  }
  return null;
}

/**
 * Retorna la ruta a la que debe redirigirse un visitante:
 * - Si Turno MAÑANA está habilitado -> '/manana'
 * - Si Turno TARDE está habilitado -> '/tarde'
 * - Si está en receso intermedio (11:00 a 12:00) -> '/tarde' (próximo turno a habilitarse)
 * - Si es de noche o madrugada (19:00 a 07:00) -> '/manana' (próximo turno a habilitarse al amanecer)
 */
export function getRutaSegunHorario() {
  const activo = getTurnoActivo();
  if (activo === 'MAÑANA') return '/manana';
  if (activo === 'TARDE') return '/tarde';

  const hora = getHoraVenezuelaDecimal();
  if (hora >= 11 && hora < 12) {
    return '/tarde';
  }
  return '/manana';
}

/**
 * Valida si un turno específico está dentro de su ventana de servicio activa.
 */
export function validarHorarioTurno(turno) {
  if (typeof window !== 'undefined' && localStorage.getItem('SISEDGUA_BYPASS_SCHEDULE') === 'true') {
    return true;
  }
  const config = HORARIOS[turno];
  if (!config) return true;
  const hora = getHoraVenezuelaDecimal();
  return hora >= config.inicio && hora < config.fin;
}
