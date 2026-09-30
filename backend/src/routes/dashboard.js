const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Estadísticas generales del dashboard
 *     description: |
 *       Devuelve métricas agregadas de asistencia escolar para el dashboard principal.
 *       Incluye totales de estudiantes, personal, asistencia, alimentación y conteo de instituciones reportadas.
 *       
 *       **Cache**: 60 segundos en Redis
 *       **Autenticación**: Requiere token JWT de admin
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fecha
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-09-29"
 *         description: "Fecha de consulta (por defecto: hoy)"
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "ROSCIO"
 *         description: Filtrar por municipio específico
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_reportes:
 *                   type: integer
 *                   example: 234
 *                   description: Total de reportes registrados
 *                 cant_instituciones_reportadas:
 *                   type: integer
 *                   example: 87
 *                   description: Cantidad de instituciones que reportaron
 *                 total_instituciones:
 *                   type: integer
 *                   example: 150
 *                   description: Total de instituciones activas en el catálogo
 *                 reportadas_display:
 *                   type: string
 *                   example: "87 de 150 instituciones"
 *                 estudiantes_asistente:
 *                   type: integer
 *                   example: 12450
 *                 estudiantes_inasistente:
 *                   type: integer
 *                   example: 550
 *                 pct_asistencia:
 *                   type: number
 *                   format: float
 *                   example: 95.8
 *                 docentes_asistente:
 *                   type: integer
 *                   example: 890
 *                 admin_asistente:
 *                   type: integer
 *                   example: 120
 *                 obrero_asistente:
 *                   type: integer
 *                   example: 340
 *                 cocina_asistente:
 *                   type: integer
 *                   example: 280
 *                 total_alimentacion:
 *                   type: integer
 *                   example: 13980
 *                   description: Total de estudiantes que recibieron alimentación
 *                 pct_alimentacion:
 *                   type: number
 *                   example: 98.5
 *                 total_estudiantes:
 *                   type: integer
 *                   example: 13000
 *       401:
 *         description: Token JWT inválido o expirado
 *       500:
 *         description: Error interno del servidor
 *
 * /dashboard/por-municipio:
 *   get:
 *     summary: Estadísticas por municipio
 *     description: |
 *       Devuelve estadísticas desglosadas por cada municipio del estado Guárico.
 *       Incluye total de instituciones activas y reportadas por municipio.
 *       
 *       **Cache**: 60 segundos en Redis
 *       **Autenticación**: Requiere token JWT de admin
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fecha
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-09-29"
 *       - name: turno
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['MAÑANA', 'TARDE']
 *         example: "MAÑANA"
 *     responses:
 *       200:
 *         description: Estadísticas por municipio
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
 *                   total_reportes:
 *                     type: integer
 *                     example: 45
 *                   estudiantes_asistente:
 *                     type: integer
 *                     example: 2340
 *                   estudiantes_inasistente:
 *                     type: integer
 *                     example: 110
 *                   pct_asistencia:
 *                     type: number
 *                     example: 95.5
 *                   reportes:
 *                     type: integer
 *                     example: 32
 *                     description: Instituciones que reportaron
 *                   total_instituciones:
 *                     type: integer
 *                     example: 45
 *                     description: Total de instituciones activas en el municipio
 *                   instituciones_display:
 *                     type: string
 *                     example: "32 de 45 instituciones"
 *
 * /dashboard/tendencia:
 *   get:
 *     summary: Tendencia temporal de asistencia
 *     description: |
 *       Devuelve la evolución de asistencia en los últimos N días.
 *       Útil para gráficos de líneas temporales.
 *       
 *       **Cache**: 120 segundos en Redis
 *       **Autenticación**: Requiere token JWT de admin
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: dias
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *         example: 7
 *         description: "Número de días hacia atrás (default: 7)"
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "ROSCIO"
 *     responses:
 *       200:
 *         description: Datos de tendencia temporal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: "2026-09-29"
 *                   total_reportes:
 *                     type: integer
 *                     example: 234
 *                   pct_asistencia:
 *                     type: number
 *                     example: 95.8
 *                   total_alimentacion:
 *                     type: integer
 *                     example: 13980
 *
 * /dashboard/reportes:
 *   get:
 *     summary: Lista de reportes con paginación
 *     description: |
 *       Obtiene la lista paginada de reportes con detalles completos.
 *       Incluye información de fecha/hora de registro (created_at) y fecha del formulario (fecha).
 *       
 *       **Cache**: 30 segundos en Redis
 *       **Autenticación**: Requiere token JWT de admin
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
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
 *       - name: turno
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['MAÑANA', 'TARDE']
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *         description: "Número de página (default: 1)"
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 100
 *         example: 50
 *         description: "Elementos por página (default: 50)"
 *     responses:
 *       200:
 *         description: Lista paginada de reportes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 1234
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 pages:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1234
 *                       turno:
 *                         type: string
 *                         example: "MAÑANA"
 *                       municipio:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["ROSCIO", "ORTIZ"]
 *                       fecha:
 *                         type: string
 *                         format: date
 *                         example: "2026-09-29"
 *                         description: Fecha del formulario
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-09-29T08:45:32.000Z"
 *                         description: Fecha y hora de registro en el sistema
 *                       nombre_institucion:
 *                         type: string
 *                         example: "Escuela Bolivariana Venezuela"
 *                       matricula_asistente:
 *                         type: integer
 *                         example: 45
 *                       matricula_inasistente:
 *                         type: integer
 *                         example: 5
 *                       incidencias:
 *                         type: string
 *                         example: "Sin incidencias"
 */
router.get('/stats', ctrl.getStats);
router.get('/por-municipio', ctrl.getPorMunicipio);
router.get('/tendencia', ctrl.getTendencia);
router.get('/reportes', ctrl.getReportes);

module.exports = router;
