/**
 * TerritorialGeoAnalyst - Subagente Territorial SISEDGUA v2
 * Rol: Análisis de cobertura y alertas de silencio en los 15 municipios de Guárico.
 */

const GUARICO_MUNICIPIOS = [
  'ROSCIO', 'ORTIZ', 'MELLADO', 'MIRANDA', 'GUAYABAL', 'CAMAGUAN',
  'CHAGUARAMAS', 'MONAGAS', 'GUARIBE', 'RONDON', 'INFANTE',
  'EL SOCORRO', 'SANTA MARIA', 'RIBAS', 'ZARAZA'
];

class TerritorialGeoAnalyst {
  constructor(name = 'TerritorialGeoAnalyst') {
    this.name = name;
    this.status = 'READY';
    this.lastRun = null;
  }

  analyzeCoverage(reportes = []) {
    this.status = 'RUNNING';
    const startTime = Date.now();

    const coverageMap = {};
    GUARICO_MUNICIPIOS.forEach(m => {
      coverageMap[m] = {
        municipio: m,
        reportesCount: 0,
        estudiantesTotal: 0,
        docentesTotal: 0
      };
    });

    for (const r of reportes) {
      let muns = r.municipio;
      if (typeof muns === 'string') muns = [muns];
      if (Array.isArray(muns)) {
        muns.forEach(m => {
          const norm = (m || '').toUpperCase().trim();
          if (coverageMap[norm]) {
            coverageMap[norm].reportesCount += 1;
            coverageMap[norm].estudiantesTotal += (Number(r.matricula_asistente) || 0);
            coverageMap[norm].docentesTotal += (Number(r.docentes_asistente) || 0);
          }
        });
      }
    }

    const silentMunicipalities = Object.values(coverageMap).filter(item => item.reportesCount === 0);
    const coveredCount = GUARICO_MUNICIPIOS.length - silentMunicipalities.length;
    const coveragePercentage = ((coveredCount / GUARICO_MUNICIPIOS.length) * 100).toFixed(1);

    this.status = 'IDLE';
    this.lastRun = new Date().toISOString();

    return {
      agent: this.name,
      executionMs: Date.now() - startTime,
      timestamp: this.lastRun,
      totalMunicipalities: GUARICO_MUNICIPIOS.length,
      coveredMunicipalities: coveredCount,
      coveragePercentage: `${coveragePercentage}%`,
      silentMunicipalities: silentMunicipalities.map(s => s.municipio),
      breakdown: Object.values(coverageMap)
    };
  }
}

module.exports = TerritorialGeoAnalyst;
