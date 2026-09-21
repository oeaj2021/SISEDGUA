const router = require('express').Router();
const ctrl = require('../controllers/capacidadMunicipioController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, ctrl.getAll);
router.post('/save', auth, ctrl.saveCapacidad);
router.post('/inicializar', auth, ctrl.inicializarMunicipios);

module.exports = router;
