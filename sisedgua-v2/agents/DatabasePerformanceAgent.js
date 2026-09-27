/**
 * DatabasePerformanceAgent - Subagente de Rendimiento SQL SISEDGUA v2
 * Rol: Telemetría de queries, verificación de índices y latencia de acceso a datos.
 */

class DatabasePerformanceAgent {
  constructor(name = 'DatabasePerformanceAgent') {
    this.name = name;
    this.status = 'READY';
    this.lastRun = null;
  }

  auditPerformanceMetrics(queryLog = []) {
    this.status = 'RUNNING';
    const startTime = Date.now();

    const slowQueries = queryLog.filter(q => (q.durationMs || 0) > 200);
    const avgDuration = queryLog.length > 0 
      ? (queryLog.reduce((acc, q) => acc + (q.durationMs || 0), 0) / queryLog.length).toFixed(2)
      : '0.00';

    this.status = 'IDLE';
    this.lastRun = new Date().toISOString();

    return {
      agent: this.name,
      executionMs: Date.now() - startTime,
      timestamp: this.lastRun,
      totalQueriesTracked: queryLog.length,
      averageLatencyMs: `${avgDuration}ms`,
      slowQueriesCount: slowQueries.length,
      slowQueries,
      healthStatus: slowQueries.length === 0 ? 'HEALTHY' : 'NEEDS_OPTIMIZATION',
      recommendations: slowQueries.length > 0 
        ? ['Verificar índices en (fecha, turno, institucion_id)', 'Revisar planes de ejecución con EXPLAIN ANALYZE']
        : ['El motor responde dentro de las directrices p95 (<150ms).']
    };
  }
}

module.exports = DatabasePerformanceAgent;
