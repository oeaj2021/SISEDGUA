const router = require('express').Router();
const ctrl = require('../controllers/institucionController');
const auth = require('../middlewares/authMiddleware');

router.get('/', ctrl.getAll);
router.post('/', auth, ctrl.create);

module.exports = router;
