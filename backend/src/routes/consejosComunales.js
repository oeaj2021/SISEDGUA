const router = require('express').Router();
const ctrl = require('../controllers/consejoComunalController');
const auth = require('../middlewares/authMiddleware');

// Registro institucional público (Mobile-First, sin bloqueo de horario escolar)
router.post('/', ctrl.crearRegistro);

// Métricas y estadísticas (Disponible para dashboard/admin)
router.get('/stats', ctrl.obtenerEstadisticas);

// Exportación oficial a Excel (Antes de '/' para evitar colisiones de ruta)
router.get('/export/excel', auth, ctrl.exportarExcel);

// Consulta y listado administrativo paginado
router.get('/', auth, ctrl.listarRegistros);

module.exports = router;
