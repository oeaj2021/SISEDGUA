const ReporteEntity = require('../domain/ReporteEntity');
const reporteRepository = require('../infrastructure/ReporteRepository');
const AgentOrchestrator = require('../../../agents/AgentOrchestrator');

class MonitoreoService {
  constructor() {
    this.repository = reporteRepository;
    this.orchestrator = new AgentOrchestrator();
  }

  async registrarReporte(dto) {
    const entity = new ReporteEntity(dto);
    const saved = await this.repository.create({
      turno: entity.turno,
      municipio: entity.municipio,
      fecha: entity.fecha,
      nombre_director: entity.nombre_director,
      cedula: entity.cedula,
      telefono: entity.telefono,
      nombre_institucion: entity.nombre_institucion,
      institucion_id: entity.institucion_id,
      matricula_asistente: entity.matricula_asistente,
      matricula_inasistente: entity.matricula_inasistente,
      docentes_asistente: entity.docentes_asistente,
      docentes_inasistente: entity.docentes_inasistente,
      admin_asistente: entity.admin_asistente,
      admin_inasistente: entity.admin_inasistente,
      obrero_asistente: entity.obrero_asistente,
      obrero_inasistente: entity.obrero_inasistente,
      cocina_asistente: entity.cocina_asistente,
      cocina_inasistente: entity.cocina_inasistente,
      incidencias: entity.incidencias
    });

    return saved;
  }

  async obtenerEstadisticasDashboard(filtros) {
    return await this.repository.getAggregatedStats(filtros);
  }

  async ejecutarAuditoriaAgentes() {
    const todos = await this.repository.getAllReports();
    return await this.orchestrator.runFullDiagnostics(todos, []);
  }

  obtenerEstadoAgentes() {
    return this.orchestrator.getAgentsStatus();
  }
}

module.exports = new MonitoreoService();
