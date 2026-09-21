const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { syncDatabase } = require('./models');
const authMiddleware = require('./middlewares/authMiddleware');

const reportesRoutes = require('./routes/reportes');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const institucionesRoutes = require('./routes/instituciones');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como apps móviles, curl o postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('https://')) {
      return callback(null, true);
    }
    return callback(null, true); // Permisivo para despliegues con reverse proxy en VPS / Dokploy
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas Públicas (Sin login)
app.use('/api/reportes', reportesRoutes);
app.use('/api/instituciones', institucionesRoutes);
app.use('/api/auth', authRoutes);

// Rutas Protegidas (Requieren token JWT de Admin)
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

// Health check para Dokploy / Docker healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SISEDGUA API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

const PORT = process.env.PORT || 3001;

// Solo inicializar el listener si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  syncDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SISEDGUA Backend activo en el puerto ${PORT}`);
    });
  });
}

module.exports = app;
