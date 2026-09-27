const express = require('express');
const router = express.Router();
const monitoreoService = require('../application/MonitoreoService');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', version: '2.0.0', system: 'SISEDGUA-V2' });
});

// Dashboard stats agregadas
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await monitoreoService.obtenerEstadisticasDashboard(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar reporte
router.post('/reportes', async (req, res) => {
  try {
    const nuevoReporte = await monitoreoService.registrarReporte(req.body);
    res.status(201).json({ ok: true, data: nuevoReporte });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Subagentes: Estado
router.get('/agents/status', (req, res) => {
  res.json(monitoreoService.obtenerEstadoAgentes());
});

// Subagentes: Disparar diagnóstico completo
router.post('/agents/run-diagnostics', async (req, res) => {
  try {
    const report = await monitoreoService.ejecutarAuditoriaAgentes();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
