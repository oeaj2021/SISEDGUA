const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./presentation/routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Límite de solicitudes excedido en API v2' }
});
app.use(limiter);

app.use(express.json());

// Rutas base API v2
app.use('/api/v2', routes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('[SISEDGUA-V2-ERROR]:', err);
  res.status(500).json({ error: 'Error interno en servidor v2' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SISEDGUA Backend v2 iniciado en http://localhost:${PORT}/api/v2`);
  });
}

module.exports = app;
