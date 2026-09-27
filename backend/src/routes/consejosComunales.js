const router = require('express').Router();
const ctrl = require('../controllers/consejoComunalController');
const auth = require('../middlewares/authMiddleware');

// Registro institucional público (Mobile-First, sin bloqueo de horario escolar)
router.post('/', ctrl.crearRegistro);

// Métricas y estadísticas (Disponible para dashboard/admin)
router.get('/stats', ctrl.obtenerEstadisticas);

// Consulta y listado administrativo paginado
router.get('/', auth, ctrl.listarRegistros);

// Exportación oficial a Excel
router.get('/export/excel', auth, ctrl.exportarExcel);

module.exports = router;
