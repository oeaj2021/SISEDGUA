const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const padronController = require('../controllers/padronController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Endpoint de consulta y autocompletado (Público con rate-limiting)
router.get('/consulta/:nacionalidad/:cedula', padronController.consultarCedula);

// Endpoints Administrativos Protegidos por JWT
router.get('/export/excel', authMiddleware, padronController.exportarExcel);
router.post('/import/excel', authMiddleware, upload.single('archivo'), padronController.importarExcel);

router.get('/stats', authMiddleware, padronController.estadisticasPadron);
router.get('/', authMiddleware, padronController.listarPadron);
router.post('/manual', authMiddleware, padronController.cargarManual);
router.post('/masivo', authMiddleware, padronController.cargarMasivo);
router.delete('/:id', authMiddleware, padronController.eliminarRegistro);

module.exports = router;
