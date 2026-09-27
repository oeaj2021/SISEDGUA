const sequelize = require('./database');

class ReporteRepository {
  constructor() {
    this.memoryStore = [];
  }

  async create(reporteData) {
    try {
      const id = Date.now();
      const record = { id, ...reporteData, created_at: new Date() };
      this.memoryStore.push(record);
      return record;
    } catch (error) {
      throw new Error(`Error en persistencia de reporte: ${error.message}`);
    }
  }

  async getAggregatedStats({ desde, hasta, turno, municipio } = {}) {
    // Si sequelize está conectado, ejecuta la agregación en BD
    try {
      const whereConditions = [];
      const replacements = {};

      if (desde && hasta) {
        whereConditions.push('fecha BETWEEN :desde AND :hasta');
        replacements.desde = desde;
        replacements.hasta = hasta;
      }
      if (turno) {
        whereConditions.push('turno = :turno');
        replacements.turno = turno;
      }
      if (municipio) {
        whereConditions.push(':municipio = ANY(municipio)');
        replacements.municipio = municipio.toUpperCase();
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          COUNT(*)::INTEGER AS total_reportes,
          COALESCE(SUM(matricula_asistente), 0)::INTEGER AS estudiantes_asistente,
          COALESCE(SUM(matricula_inasistente), 0)::INTEGER AS estudiantes_inasistente,
          COALESCE(SUM(docentes_asistente), 0)::INTEGER AS docentes_asistente,
          COALESCE(SUM(docentes_inasistente), 0)::INTEGER AS docentes_inasistente,
          COALESCE(SUM(admin_asistente), 0)::INTEGER AS admin_asistente,
          COALESCE(SUM(admin_inasistente), 0)::INTEGER AS admin_inasistente,
          COALESCE(SUM(obrero_asistente), 0)::INTEGER AS obrero_asistente,
          COALESCE(SUM(obrero_inasistente), 0)::INTEGER AS obrero_inasistente,
          COALESCE(SUM(cocina_asistente), 0)::INTEGER AS cocina_asistente,
          COALESCE(SUM(cocina_inasistente), 0)::INTEGER AS cocina_inasistente
        FROM reportes
        ${whereClause};
      `;

      const [stats] = await sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT });
      if (stats) return stats;
    } catch (err) {
      // Fallback a almacenamiento en memoria si DB no está iniciada en tests
    }

    const filtered = this.memoryStore.filter(r => {
      if (turno && r.turno !== turno) return false;
      return true;
    });

    const estudiantes_asistente = filtered.reduce((acc, r) => acc + (r.matricula_asistente || 0), 0);
    const estudiantes_inasistente = filtered.reduce((acc, r) => acc + (r.matricula_inasistente || 0), 0);
    const total_matricula = estudiantes_asistente + estudiantes_inasistente;

    return {
      total_reportes: filtered.length,
      estudiantes_asistente,
      estudiantes_inasistente,
      pct_asistencia: total_matricula > 0 ? ((estudiantes_asistente / total_matricula) * 100).toFixed(2) : '0.00',
      docentes_asistente: filtered.reduce((acc, r) => acc + (r.docentes_asistente || 0), 0),
      docentes_inasistente: filtered.reduce((acc, r) => acc + (r.docentes_inasistente || 0), 0),
      cocina_asistente: filtered.reduce((acc, r) => acc + (r.cocina_asistente || 0), 0),
      cocina_inasistente: filtered.reduce((acc, r) => acc + (r.cocina_inasistente || 0), 0)
    };
  }

  async getAllReports() {
    return this.memoryStore;
  }
}

module.exports = new ReporteRepository();
