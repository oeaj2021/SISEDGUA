const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');

router.get('/stats', ctrl.getStats);
router.get('/por-municipio', ctrl.getPorMunicipio);
router.get('/tendencia', ctrl.getTendencia);
router.get('/reportes', ctrl.getReportes);

module.exports = router;
