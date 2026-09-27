/**
 * AuditIntegrityGuardian - Subagente de Integridad de Datos SISEDGUA v2
 * Rol: Detección continua de anomalías estadísticas y reportes duplicados.
 */

class AuditIntegrityGuardian {
  constructor(name = 'AuditIntegrityGuardian') {
    this.name = name;
    this.status = 'READY';
    this.lastRun = null;
  }

  auditReports(reportes = []) {
    this.status = 'RUNNING';
    const startTime = Date.now();
    const anomalies = [];
    const duplicates = [];
    const seenMap = new Map();

    for (const r of reportes) {
      // 1. Detección de duplicados potenciales por institución + fecha + turno
      const key = `${r.nombre_institucion || r.institucion_id}-${r.fecha}-${r.turno}`.toLowerCase();
      if (seenMap.has(key)) {
        duplicates.push({
          reportId: r.id,
          originalId: seenMap.get(key),
          institucion: r.nombre_institucion,
          fecha: r.fecha,
          turno: r.turno,
          severity: 'HIGH'
        });
      } else {
        seenMap.set(key, r.id);
      }

      // 2. Cálculo de ratio de asistencia
      const matriculaTotal = (Number(r.matricula_asistente) || 0) + (Number(r.matricula_inasistente) || 0);
      if (matriculaTotal > 0) {
        const ratioAsistencia = (Number(r.matricula_asistente) || 0) / matriculaTotal;
        if (ratioAsistencia < 0.15) {
          anomalies.push({
            reportId: r.id,
            institucion: r.nombre_institucion,
            municipio: r.municipio,
            issue: 'ASISTENCIA_ANORMALMENTE_BAJA',
            detail: `Asistencia menor al 15% (${(ratioAsistencia * 100).toFixed(1)}%)`,
            severity: 'CRITICAL'
          });
        }
      }

      // 3. Desbalance CNAE (Comedor sin cocineras con matrícula alta)
      if ((Number(r.cocina_asistente) || 0) === 0 && (Number(r.matricula_asistente) || 0) > 150) {
        anomalies.push({
          reportId: r.id,
          institucion: r.nombre_institucion,
          municipio: r.municipio,
          issue: 'ALERTA_CNAE_SIN_COCINERA',
          detail: 'Matrícula superior a 150 alumnos sin cocinera asistente reportada',
          severity: 'MEDIUM'
        });
      }
    }

    this.status = 'IDLE';
    this.lastRun = new Date().toISOString();

    return {
      agent: this.name,
      executionMs: Date.now() - startTime,
      timestamp: this.lastRun,
      totalAudited: reportes.length,
      anomaliesFound: anomalies.length,
      duplicatesFound: duplicates.length,
      anomalies,
      duplicates,
      summary: anomalies.length === 0 && duplicates.length === 0 
        ? '✅ Integridad de datos verificada sin anomalías críticas.' 
        : `⚠️ Se detectaron ${anomalies.length} anomalías y ${duplicates.length} duplicados.`
    };
  }
}

module.exports = AuditIntegrityGuardian;
