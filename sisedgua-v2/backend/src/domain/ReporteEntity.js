/**
 * ReporteEntity - Entidad de Dominio en Bounded Context de Monitoreo
 */

class ReporteEntity {
  constructor({
    id = null,
    turno,
    municipio,
    fecha,
    nombre_director,
    cedula,
    telefono,
    nombre_institucion,
    institucion_id = null,
    matricula_asistente = 0,
    matricula_inasistente = 0,
    docentes_asistente = 0,
    docentes_inasistente = 0,
    admin_asistente = 0,
    admin_inasistente = 0,
    obrero_asistente = 0,
    obrero_inasistente = 0,
    cocina_asistente = 0,
    cocina_inasistente = 0,
    incidencias = ''
  }) {
    this.id = id;
    this.turno = turno;
    this.municipio = municipio;
    this.fecha = fecha;
    this.nombre_director = nombre_director;
    this.cedula = cedula;
    this.telefono = telefono;
    this.nombre_institucion = nombre_institucion;
    this.institucion_id = institucion_id;
    this.matricula_asistente = Number(matricula_asistente) || 0;
    this.matricula_inasistente = Number(matricula_inasistente) || 0;
    this.docentes_asistente = Number(docentes_asistente) || 0;
    this.docentes_inasistente = Number(docentes_inasistente) || 0;
    this.admin_asistente = Number(admin_asistente) || 0;
    this.admin_inasistente = Number(admin_inasistente) || 0;
    this.obrero_asistente = Number(obrero_asistente) || 0;
    this.obrero_inasistente = Number(obrero_inasistente) || 0;
    this.cocina_asistente = Number(cocina_asistente) || 0;
    this.cocina_inasistente = Number(cocina_inasistente) || 0;
    this.incidencias = incidencias;
  }

  get totalMatricula() {
    return this.matricula_asistente + this.matricula_inasistente;
  }

  get porcentajeAsistencia() {
    if (this.totalMatricula === 0) return 0;
    return Number(((this.matricula_asistente / this.totalMatricula) * 100).toFixed(2));
  }

  get hasAlertaCNAE() {
    return this.cocina_asistente === 0 && this.matricula_asistente > 100;
  }
}

module.exports = ReporteEntity;
