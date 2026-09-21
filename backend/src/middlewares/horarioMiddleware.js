/**
 * Valida que el formulario se envíe dentro del horario permitido.
 * Turno MAÑANA: 07:00-12:00 (Venezuela UTC-4)
 * Turno TARDE:  13:00-22:00 (Venezuela UTC-4)
 */
module.exports = (req, res, next) => {
  const { turno } = req.body;
  if (!turno) return next();

  // Obtener hora actual en Venezuela (UTC-4)
  const now = new Date();
  const venezuelaOffset = -4 * 60; // minutos
  const localMs = now.getTime() + (now.getTimezoneOffset() + venezuelaOffset) * 60000;
  const local = new Date(localMs);
  const hora = local.getHours();
  const min  = local.getMinutes();
  const horaDecimal = hora + min / 60;

  const HORARIOS = {
    'MAÑANA': { inicio: 7, fin: 12 },
    'TARDE':  { inicio: 13, fin: 22 }
  };

  const rango = HORARIOS[turno];
  if (!rango) return next();

  // En entorno de desarrollo o pruebas, permitir bypass con flag opcional si se requiere
  if (process.env.IGNORE_SCHEDULE === 'true') {
    return next();
  }

  if (horaDecimal < rango.inicio || horaDecimal >= rango.fin) {
    const apertura = rango.inicio < 12
      ? `${rango.inicio}:00 AM`
      : `${rango.inicio === 12 ? 12 : rango.inicio - 12}:00 PM`;
    return res.status(403).json({
      error: 'FUERA_DE_HORARIO',
      mensaje: `El formulario del turno ${turno} solo está disponible de ${rango.inicio}:00 a ${rango.fin}:00 (hora de Venezuela).`,
      turno,
      hora_actual: `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      apertura
    });
  }

  next();
};
