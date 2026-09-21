const router = require('express').Router();
const ctrl = require('../controllers/exportController');

router.get('/excel', ctrl.exportExcel);

module.exports = router;
