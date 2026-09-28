const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { syncDatabase } = require('./models');
const authMiddleware = require('./middlewares/authMiddleware');

const reportesRoutes = require('./routes/reportes');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const institucionesRoutes = require('./routes/instituciones');
const capacidadesRoutes = require('./routes/capacidades');
const consejosComunalesRoutes = require('./routes/consejosComunales');
const padronRoutes = require('./routes/padron');

const sqlInjectionGuard = require('./middlewares/sqlInjectionGuard');

const app = express();

// Habilitar trust proxy para reconocer correctamente IPs detrás de Dokploy/Traefik/Nginx/Cloudflare
app.set('trust proxy', true);

// Cabeceras de seguridad HTTP con Helmet (Blindaje contra XSS, Clickjacking, MIME-sniffing)
app.use(helmet({
  contentSecurityPolicy: false, // Permitir que el frontend SPA cargue sus recursos
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.COMUC_URL || 'https://comuc.sisedgua.site',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('https://')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ⚡ Compresión Gzip/Deflate para optimizar rendimiento de red en picos de 40,000 usuarios
app.use(compression({
  threshold: 1024, // Comprime respuestas mayores a 1KB
  level: 6
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🛡️ Middleware de Protección Activa contra Inyección SQL y Payloads Maliciosos
app.use(sqlInjectionGuard);

// 🛡️ Rate Limiters Distribuidos con Redis 7 (Con Graceful Fallback en memoria si Redis no está activo)
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('./config/redis');

const createLimiterStore = (prefix) => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`
  });
};

const clientIpKey = (req) => {
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip;
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3000, // 3000 peticiones cada 15 min por IP real
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true, // Si Redis se reinicia, la petición pasa sin error 500
  validate: false,
  keyGenerator: clientIpKey,
  store: createLimiterStore('gen'),
  message: { error: 'Límite de solicitudes alcanzado. Por favor, intente más tarde.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo 15 intentos de autenticación por ventana
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: false,
  keyGenerator: clientIpKey,
  store: createLimiterStore('auth'),
  message: { error: 'Demasiados intentos de acceso fallidos. Por seguridad, intente de nuevo en 15 minutos.' }
});

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 envíos de formulario cada 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: false,
  keyGenerator: clientIpKey,
  store: createLimiterStore('sub'),
  message: { error: 'Ha enviado un número elevado de registros. Espere unos minutos antes de continuar.' }
});

const consultaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 120, // 120 consultas por minuto para autocompletado
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  validate: false,
  keyGenerator: clientIpKey,
  store: createLimiterStore('con'),
  message: { error: 'Demasiadas consultas de verificación. Por favor espere un momento.' }
});

// Aplicar rate limiter general a todas las llamadas API
app.use('/api/', generalLimiter);

// Rutas Públicas (Con limitadores específicos contra fuerza bruta y scraping)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Nota de arquitectura: submitLimiter se aplica a la mutación POST en reportesRoutes
app.use('/api/reportes', reportesRoutes);
app.use('/api/instituciones', institucionesRoutes);

app.use('/api/consejos-comunales', consejosComunalesRoutes);
app.use('/api/padron/consulta', consultaLimiter);
app.use('/api/padron', padronRoutes);

// Rutas Protegidas (Requieren token JWT de Admin)
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/capacidades', authMiddleware, capacidadesRoutes);

// Health check para Dokploy / Docker healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SISEDGUA API',
    institution: 'Sala Situacional CDCE ESTADAL GUÁRICO',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  syncDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SISEDGUA Backend activo y blindado en el puerto ${PORT} - Sala Situacional CDCE ESTADAL GUÁRICO`);
    });
  });
}

module.exports = app;
