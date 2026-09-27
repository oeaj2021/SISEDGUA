/**
 * AgentOrchestrator - Orquestador Central de Subagentes SISEDGUA v2
 * Coordina los ciclos de auditoría, geolocalización y telemetría de rendimiento.
 */

const AuditIntegrityGuardian = require('./AuditIntegrityGuardian');
const TerritorialGeoAnalyst = require('./TerritorialGeoAnalyst');
const DatabasePerformanceAgent = require('./DatabasePerformanceAgent');

class AgentOrchestrator {
  constructor() {
    this.auditGuardian = new AuditIntegrityGuardian();
    this.geoAnalyst = new TerritorialGeoAnalyst();
    this.dbPerfAgent = new DatabasePerformanceAgent();
    this.history = [];
  }

  getAgentsStatus() {
    return [
      { id: 'audit-guardian', name: this.auditGuardian.name, status: this.auditGuardian.status, lastRun: this.auditGuardian.lastRun },
      { id: 'geo-analyst', name: this.geoAnalyst.name, status: this.geoAnalyst.status, lastRun: this.geoAnalyst.lastRun },
      { id: 'db-perf-agent', name: this.dbPerfAgent.name, status: this.dbPerfAgent.status, lastRun: this.dbPerfAgent.lastRun }
    ];
  }

  async runFullDiagnostics(reportes = [], queryLog = []) {
    const startedAt = new Date().toISOString();
    
    const auditResult = this.auditGuardian.auditReports(reportes);
    const geoResult = this.geoAnalyst.analyzeCoverage(reportes);
    const dbResult = this.dbPerfAgent.auditPerformanceMetrics(queryLog);

    const diagnosticReport = {
      sessionId: `diag-${Date.now()}`,
      timestamp: startedAt,
      overallStatus: auditResult.anomaliesFound === 0 ? 'SYSTEM_STABLE' : 'ACTION_REQUIRED',
      agents: {
        audit: auditResult,
        territorial: geoResult,
        database: dbResult
      }
    };

    this.history.unshift(diagnosticReport);
    if (this.history.length > 20) this.history.pop();

    return diagnosticReport;
  }
}

module.exports = AgentOrchestrator;
