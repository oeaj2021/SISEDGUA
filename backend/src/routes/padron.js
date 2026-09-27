const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const padronController = require('../controllers/padronController');

// Endpoint de consulta y autocompletado (Público con rate-limiting)
router.get('/consulta/:nacionalidad/:cedula', padronController.consultarCedula);

// Endpoints Administrativos Protegidos por JWT
router.get('/stats', authMiddleware, padronController.estadisticasPadron);
router.get('/', authMiddleware, padronController.listarPadron);
router.post('/manual', authMiddleware, padronController.cargarManual);
router.post('/masivo', authMiddleware, padronController.cargarMasivo);
router.delete('/:id', authMiddleware, padronController.eliminarRegistro);

module.exports = router;
