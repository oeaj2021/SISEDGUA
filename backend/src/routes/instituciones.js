const router = require('express').Router();
const ctrl = require('../controllers/institucionController');
const auth = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Rutas de Exportación e Importación en Excel (Protegidas)
router.get('/export/excel', auth, ctrl.exportarExcel);
router.post('/import/excel', auth, upload.single('archivo'), ctrl.importarExcel);

// Consulta pública (usada por el formulario)
router.get('/', ctrl.getAll);
router.get('/capacidad', auth, ctrl.getCapacidadMunicipios);
router.get('/:id', auth, ctrl.getById);

// Operaciones protegidas de Administrador
router.post('/', auth, ctrl.create);
router.post('/delete-batch', auth, ctrl.deleteBatch);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);

module.exports = router;

