const router = require('express').Router();
const ctrl = require('../controllers/consejoComunalController');
const auth = require('../middlewares/authMiddleware');

// Registro institucional público (Mobile-First, sin bloqueo de horario escolar)
router.post('/', ctrl.crearRegistro);

// Métricas y estadísticas (Disponible para admin autenticado)
router.get('/stats', ctrl.obtenerEstadisticas);

module.exports = router;
