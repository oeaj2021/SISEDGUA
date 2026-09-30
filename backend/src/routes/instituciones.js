const router = require('express').Router();
const ctrl = require('../controllers/institucionController');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * @swagger
 * /instituciones:
 *   get:
 *     summary: Listar todas las instituciones activas
 *     description: |
 *       Obtiene el catálogo completo de instituciones educativas activas.
 *       Disponible públicamente (sin autenticación) para uso en formularios de reportes.
 *       
 *       **Cache**: 300 segundos en Redis
 *     tags:
 *       - Instituciones
 *     parameters:
 *       - name: municipio
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "ROSCIO"
 *         description: Filtrar por municipio específico
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "Bolivariana"
 *         description: Búsqueda por nombre de institución (LIKE insensible a mayúsculas)
 *     responses:
 *       200:
 *         description: Lista de instituciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: "Escuela Bolivariana Venezuela"
 *                   municipio:
 *                     type: string
 *                     example: "ROSCIO"
 *                   tipo:
 *                     type: string
 *                     enum: ['PRIMARIA', 'SECUNDARIA', 'INICIAL', 'MIXTA', 'ESPECIAL']
 *                     example: "PRIMARIA"
 *                   capacidad:
 *                     type: integer
 *                     example: 500
 *                   activo:
 *                     type: boolean
 *                     example: true
 *   post:
 *     summary: Crear nueva institución (Admin)
 *     description: |
 *       Crea una nueva institución en el catálogo.
 *       Requiere autenticación de administrador.
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - municipio
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Escuela Bolivariana Venezuela"
 *               municipio:
 *                 type: string
 *                 example: "ROSCIO"
 *               tipo:
 *                 type: string
 *                 enum: ['PRIMARIA', 'SECUNDARIA', 'INICIAL', 'MIXTA', 'ESPECIAL']
 *               capacidad:
 *                 type: integer
 *                 example: 500
 *     responses:
 *       201:
 *         description: Institución creada exitosamente
 *       401:
 *         description: Token JWT inválido
 *       500:
 *         description: Error interno del servidor
 *
 * /instituciones/export/excel:
 *   get:
 *     summary: Exportar catálogo de instituciones a Excel
 *     description: |
 *       Descarga el catálogo completo de instituciones en formato Excel (.xlsx).
 *       Requiere autenticación de administrador.
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo Excel con catálogo de instituciones
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Token JWT inválido
 *
 * /instituciones/import/excel:
 *   post:
 *     summary: Importar instituciones desde Excel
 *     description: |
 *       Carga un lote de instituciones desde un archivo Excel.
 *       Reemplaza el catálogo existente.
 *       Requiere autenticación de administrador.
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo Excel (.xlsx) con columnas nombre,municipio,tipo,capacidad
 *     responses:
 *       200:
 *         description: Importación exitosa
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
 *                   example: "234 instituciones importadas exitosamente"
 *       400:
 *         description: Archivo inválido o formato incorrecto
 *       401:
 *         description: Token JWT inválido
 *
 * /instituciones/capacidad:
 *   get:
 *     summary: Capacidad total de instituciones por municipio
 *     description: |
 *       Devuelve la suma de capacidades de todas las instituciones agrupadas por municipio.
 *       Útil para calcular porcentajes de ocupación.
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Capacidades por municipio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 ROSCIO: 15000
 *                 ORTIZ: 12500
 *                 MELLADO: 8750
 *
 * /instituciones/{id}:
 *   get:
 *     summary: Obtener institución específica
 *     description: Requiere autenticación de administrador
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Datos de la institución
 *       404:
 *         description: Institución no encontrada
 *       401:
 *         description: Token JWT inválido
 *   put:
 *     summary: Actualizar institución
 *     description: Requiere autenticación de administrador
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               municipio:
 *                 type: string
 *               tipo:
 *                 type: string
 *               capacidad:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Institución actualizada
 *       401:
 *         description: Token JWT inválido
 *   delete:
 *     summary: Eliminar institución (cambiar a inactiva)
 *     description: Requiere autenticación de administrador
 *     tags:
 *       - Instituciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Institución eliminada
 *       401:
 *         description: Token JWT inválido
 */

// Rutas de Exportación e Importación en Excel (Protegidas)
router.get('/export/excel', auth, ctrl.exportarExcel);
router.post('/import/excel', auth, upload.single('archivo'), ctrl.importarExcel);

// Consulta pública (usada por el formulario)
router.get('/', ctrl.getAll);
router.get('/capacidad', auth, ctrl.getCapacidadMunicipios);
router.get('/:id', auth, ctrl.getById);

// Operaciones protegidas de Administrador
router.post('/', auth, ctrl.create);
router.post('/delete-batch', auth, ctrl.deleteBatch);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);

module.exports = router;

