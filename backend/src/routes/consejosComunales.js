const router = require('express').Router();
const ctrl = require('../controllers/consejoComunalController');
const auth = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /consejos-comunales:
 *   post:
 *     summary: Registrar nuevo consejo comunal
 *     description: |
 *       Registra un nuevo consejo comunal sin restricción de horario.
 *       Disponible públicamente (mobile-first, sin bloqueo de horario escolar).
 *       
 *       **Nota**: La fecha registrada en el sistema es la del servidor, NO la enviada por el cliente.
 *     tags:
 *       - Consejos Comunales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - municipio
 *               - nombre_comunidad
 *               - nombre_responsable
 *               - telefono
 *               - actividades
 *             properties:
 *               municipio:
 *                 type: string
 *                 example: "ROSCIO"
 *               nombre_comunidad:
 *                 type: string
 *                 example: "Comunidad La Esperanza"
 *               nombre_responsable:
 *                 type: string
 *                 example: "María García López"
 *               cedula_responsable:
 *                 type: string
 *                 example: "12345678"
 *               telefono:
 *                 type: string
 *                 example: "+58 (289) 456-7890"
 *               actividades:
 *                 type: string
 *                 description: Descripción de actividades realizadas
 *                 example: "Limpieza de calles, charlas educativas"
 *               asistentes:
 *                 type: integer
 *                 example: 45
 *                 description: Número de participantes
 *     responses:
 *       201:
 *         description: Consejo comunal registrado exitosamente
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
 *                   example: "Registro de consejo comunal creado exitosamente"
 *                 id:
 *                   type: integer
 *                   example: 567
 *       400:
 *         description: Validación fallida (campos requeridos)
 *       500:
 *         description: Error interno del servidor
 *   get:
 *     summary: Listar registros de consejos comunales (Admin)
 *     description: |
 *       Obtiene la lista paginada de todos los registros de consejos comunales.
 *       Requiere autenticación de administrador.
 *       
 *       **Cache**: 60 segundos en Redis
 *     tags:
 *       - Consejos Comunales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 100
 *         example: 50
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "ROSCIO"
 *       - name: fecha
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-09-29"
 *     responses:
 *       200:
 *         description: Lista paginada de consejos comunales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 234
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 pages:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       municipio:
 *                         type: string
 *                       nombre_comunidad:
 *                         type: string
 *                       nombre_responsable:
 *                         type: string
 *                       telefono:
 *                         type: string
 *                       asistentes:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha y hora de registro
 *       401:
 *         description: Token JWT inválido
 *
 * /consejos-comunales/stats:
 *   get:
 *     summary: Estadísticas de consejos comunales
 *     description: |
 *       Devuelve métricas agregadas de registros comunales por municipio.
 *       Disponible públicamente para uso en dashboard comunal.
 *       
 *       **Cache**: 120 segundos en Redis
 *     tags:
 *       - Consejos Comunales
 *     parameters:
 *       - name: fecha
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-09-29"
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "ROSCIO"
 *     responses:
 *       200:
 *         description: Estadísticas de consejos comunales
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
 *                   total_registros:
 *                     type: integer
 *                     example: 12
 *                   total_asistentes:
 *                     type: integer
 *                     example: 340
 *                   promedio_asistentes:
 *                     type: number
 *                     example: 28.3
 *
 * /consejos-comunales/export/excel:
 *   get:
 *     summary: Exportar registros a Excel
 *     description: |
 *       Descarga todos los registros de consejos comunales en formato Excel.
 *       Requiere autenticación de administrador.
 *     tags:
 *       - Consejos Comunales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fecha
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo Excel con registros de consejos comunales
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Token JWT inválido
 */

// Registro institucional público (Mobile-First, sin bloqueo de horario escolar)
router.post('/', ctrl.crearRegistro);

// Métricas y estadísticas (Disponible para dashboard/admin)
router.get('/stats', ctrl.obtenerEstadisticas);

// Exportación oficial a Excel (Antes de '/' para evitar colisiones de ruta)
router.get('/export/excel', auth, ctrl.exportarExcel);

// Consulta y listado administrativo paginado
router.get('/', auth, ctrl.listarRegistros);

module.exports = router;
