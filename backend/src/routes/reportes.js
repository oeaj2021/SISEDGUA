const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const ctrl = require('../controllers/reporteController');
const horario = require('../middlewares/horarioMiddleware');

const clientIpKey = (req) => {
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip;
};

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 envíos cada 15 min por IP real
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: false,
  keyGenerator: clientIpKey,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:rep_sub:'
  }),
  message: { error: 'Ha enviado un número elevado de registros. Espere unos minutos antes de continuar.' }
});

router.post('/', submitLimiter, horario, ctrl.create);
router.get('/check-duplicado', ctrl.checkDuplicado);
router.get('/conteo-hoy', ctrl.getConteoHoy);

module.exports = router;

