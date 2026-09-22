const router = require('express').Router();
const ctrl = require('../controllers/reporteController');
const horario = require('../middlewares/horarioMiddleware');

router.post('/', horario, ctrl.create);
router.get('/check-duplicado', ctrl.checkDuplicado);
router.get('/conteo-hoy', ctrl.getConteoHoy);

module.exports = router;

