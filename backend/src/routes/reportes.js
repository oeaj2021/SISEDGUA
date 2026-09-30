const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const ctrl = require('../controllers/reporteController');
const horario = require('../middlewares/horarioMiddleware');

const clientIpKey = (req) => {
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip;
};

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 envíos cada 15 min por IP real
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: false,
  keyGenerator: clientIpKey,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:rep_sub:'
  }),
  message: { error: 'Ha enviado un número elevado de registros. Espere unos minutos antes de continuar.' }
});

/**
 * @swagger
 * /reportes:
 *   post:
 *     summary: Registrar nuevo reporte de asistencia
 *     description: |
 *       Registra un nuevo reporte de asistencia escolar/comunal. 
 *       
 *       **Restricciones**:
 *       - Solo se puede registrar durante las horas de operación (4:00 AM - 6:00 PM)
 *       - Rate limit: 50 reportes cada 15 minutos por IP
 *       - La fecha registrada es la del servidor, NO la enviada por el cliente
 *     tags:
 *       - Reportes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turno
 *               - municipio
 *               - fecha
 *               - nombre_director
 *               - cedula
 *               - telefono
 *               - nombre_institucion
 *               - incidencias
 *             properties:
 *               turno:
 *                 type: string
 *                 enum: ['MAÑANA', 'TARDE']
 *                 example: "MAÑANA"
 *                 description: Turno escolar
 *               municipio:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['ROSCIO', 'ORTIZ']
 *                 description: Lista de municipios válidos de Guárico
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-29"
 *                 description: Fecha del formulario (YYYY-MM-DD). La hora de registro se asigna automáticamente
 *               nombre_director:
 *                 type: string
 *                 example: "Juan Pérez García"
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               telefono:
 *                 type: string
 *                 example: "+58 (289) 123-4567"
 *               nombre_institucion:
 *                 type: string
 *                 example: "Escuela Bolivariana Venezuela"
 *               institucion_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID de la institución del catálogo (opcional si es manual)
 *               matricula_asistente:
 *                 type: integer
 *                 default: 0
 *                 example: 45
 *               matricula_inasistente:
 *                 type: integer
 *                 default: 0
 *                 example: 5
 *               docentes_asistente:
 *                 type: integer
 *                 default: 0
 *               docentes_inasistente:
 *                 type: integer
 *                 default: 0
 *               admin_asistente:
 *                 type: integer
 *                 default: 0
 *               admin_inasistente:
 *                 type: integer
 *                 default: 0
 *               obrero_asistente:
 *                 type: integer
 *                 default: 0
 *               obrero_inasistente:
 *                 type: integer
 *                 default: 0
 *               cocina_asistente:
 *                 type: integer
 *                 default: 0
 *               cocina_inasistente:
 *                 type: integer
 *                 default: 0
 *               incidencias:
 *                 type: string
 *                 example: "Falta de agua potable en comedores"
 *     responses:
 *       201:
 *         description: Reporte registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 mensaje:
 *                   type: string
 *                   example: "Reporte registrado exitosamente"
 *                 id:
 *                   type: integer
 *                   example: 1234
 *       400:
 *         description: Validación fallida (campos requeridos, turno inválido, municipio inválido)
 *       403:
 *         description: "Fuera de horario de operación escolar"
 *       429:
 *         description: Límite de reportes excedido
 *       500:
 *         description: Error interno del servidor
 *
 * /reportes/check-duplicado:
 *   get:
 *     summary: Verificar reporte duplicado
 *     description: |
 *       Verifica si ya existe un reporte con los mismos parámetros en la fecha actual.
 *       Esto previene envíos accidentales duplicados.
 *     tags:
 *       - Reportes
 *     parameters:
 *       - name: nombre_institucion
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         example: "Escuela Bolivariana Venezuela"
 *       - name: fecha
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-09-29"
 *       - name: turno
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['MAÑANA', 'TARDE']
 *         example: "MAÑANA"
 *     responses:
 *       200:
 *         description: Resultado de verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 duplicado:
 *                   type: boolean
 *                   example: false
 *
 * /reportes/conteo-hoy:
 *   get:
 *     summary: Conteo de reportes por municipio (Hoy)
 *     description: |
 *       Devuelve el conteo de reportes registrados hoy, agrupados por municipio y turno.
 *       Incluye el total de instituciones activas por municipio.
 *       Datos cacheados por 60 segundos.
 *     tags:
 *       - Reportes
 *     responses:
 *       200:
 *         description: Conteo de reportes por municipio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   municipio:
 *                     type: string
 *                     example: "ROSCIO"
 *                   total:
 *                     type: integer
 *                     example: 12
 *                   manana:
 *                     type: integer
 *                     example: 8
 *                   tarde:
 *                     type: integer
 *                     example: 4
 *                   total_instituciones:
 *                     type: integer
 *                     example: 25
 */
router.post('/', submitLimiter, horario, ctrl.create);
router.get('/check-duplicado', ctrl.checkDuplicado);
router.get('/conteo-hoy', ctrl.getConteoHoy);

module.exports = router;

