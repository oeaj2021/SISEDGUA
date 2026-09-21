require('dotenv').config();
const { Institucion, syncDatabase } = require('../models');

const CATALOGO_GUÁRICO = [
  // 1. JUAN GERMÁN ROSCIO (San Juan de los Morros)
  { municipio: 'ROSCIO', nombre: 'U.E. Juan Germán Roscio', codigo: 'OD-001' },
  { municipio: 'ROSCIO', nombre: 'L.B. Dr. Vicente Peña', codigo: 'OD-002' },
  { municipio: 'ROSCIO', nombre: 'E.B. República de Brasil', codigo: 'OD-003' },
  { municipio: 'ROSCIO', nombre: 'U.E. Colegio San Juan Bautista', codigo: 'OD-004' },
  { municipio: 'ROSCIO', nombre: 'E.B. Eduardo Méndez', codigo: 'OD-005' },
  { municipio: 'ROSCIO', nombre: 'U.E. Mercedes Rojas de Pérez', codigo: 'OD-006' },
  { municipio: 'ROSCIO', nombre: 'E.B. José Félix Ribas', codigo: 'OD-007' },

  // 2. LEONARDO INFANTE (Valle de la Pascua)
  { municipio: 'INFANTE', nombre: 'L.B. José Gil Fortoul', codigo: 'INF-001' },
  { municipio: 'INFANTE', nombre: 'E.B. Francisco Lazo Martí', codigo: 'INF-002' },
  { municipio: 'INFANTE', nombre: 'U.E. Carlos José Bello', codigo: 'INF-003' },
  { municipio: 'INFANTE', nombre: 'U.E. Nuestra Señora del Valle', codigo: 'INF-004' },
  { municipio: 'INFANTE', nombre: 'E.B. Juana Josefa Vargas', codigo: 'INF-005' },
  { municipio: 'INFANTE', nombre: 'L.B. Ramón Buenahora', codigo: 'INF-006' },

  // 3. FRANCISCO DE MIRANDA (Calabozo)
  { municipio: 'MIRANDA', nombre: 'L.B. Francisco de Miranda', codigo: 'MIR-001' },
  { municipio: 'MIRANDA', nombre: 'U.E. Andrés Eloy Blanco', codigo: 'MIR-002' },
  { municipio: 'MIRANDA', nombre: 'E.B. América', codigo: 'MIR-003' },
  { municipio: 'MIRANDA', nombre: 'U.E. Agustín Codazzi', codigo: 'MIR-004' },
  { municipio: 'MIRANDA', nombre: 'E.B. Ramón Francisco Feo', codigo: 'MIR-005' },

  // 4. PEDRO ZARAZA (Zaraza)
  { municipio: 'ZARAZA', nombre: 'L.B. Eduardo Delfín Méndez', codigo: 'ZRZ-001' },
  { municipio: 'ZARAZA', nombre: 'E.B. Columba Silva', codigo: 'ZRZ-002' },
  { municipio: 'ZARAZA', nombre: 'U.E. Presbítero Rodríguez', codigo: 'ZRZ-003' },
  { municipio: 'ZARAZA', nombre: 'E.B. Bonifacio Gómez', codigo: 'ZRZ-004' },

  // 5. JOSÉ TADEO MONAGAS (Altagracia de Orituco)
  { municipio: 'MONAGAS', nombre: 'L.B. Ramón Rochette', codigo: 'MON-001' },
  { municipio: 'MONAGAS', nombre: 'U.E. Chapaiguana', codigo: 'MON-002' },
  { municipio: 'MONAGAS', nombre: 'E.B. José Ramón Camejo', codigo: 'MON-003' },
  { municipio: 'MONAGAS', nombre: 'U.E. Padre Pedro Pablo Tenorio', codigo: 'MON-004' },

  // 6. JULIÁN MELLADO (El Sombrero)
  { municipio: 'MELLADO', nombre: 'L.B. Alberto Arvelo Torrealba', codigo: 'MEL-001' },
  { municipio: 'MELLADO', nombre: 'E.B. Julián Mellado', codigo: 'MEL-002' },
  { municipio: 'MELLADO', nombre: 'U.E. El Sombrero', codigo: 'MEL-003' },

  // 7. JOSÉ FÉLIX RIBAS (Tucupido)
  { municipio: 'RIBAS', nombre: 'L.B. Pedro Itriago Chacín', codigo: 'RIB-001' },
  { municipio: 'RIBAS', nombre: 'E.B. Narciso López Camacho', codigo: 'RIB-002' },
  { municipio: 'RIBAS', nombre: 'U.E. Tucupido', codigo: 'RIB-003' },

  // 8. JUAN JOSÉ RONDÓN (Las Mercedes del Llano)
  { municipio: 'RONDON', nombre: 'L.B. Rafael Paredes', codigo: 'RON-001' },
  { municipio: 'RONDON', nombre: 'E.B. Monseñor Rodríguez Álvarez', codigo: 'RON-002' },
  { municipio: 'RONDON', nombre: 'U.E. Las Mercedes', codigo: 'RON-003' },

  // 9. EL SOCORRO
  { municipio: 'EL SOCORRO', nombre: 'L.B. El Socorro', codigo: 'SOC-001' },
  { municipio: 'EL SOCORRO', nombre: 'E.B. José Félix Ribas', codigo: 'SOC-002' },

  // 10. SANTA MARÍA DE IPIRE
  { municipio: 'SANTA MARIA', nombre: 'L.B. Carapa', codigo: 'SMI-001' },
  { municipio: 'SANTA MARIA', nombre: 'E.B. Santa María', codigo: 'SMI-002' },

  // 11. CHAGUARAMAS
  { municipio: 'CHAGUARAMAS', nombre: 'L.B. Chaguaramas', codigo: 'CHG-001' },
  { municipio: 'CHAGUARAMAS', nombre: 'E.B. Guárico', codigo: 'CHG-002' },

  // 12. SAN JOSÉ DE GUARIBE
  { municipio: 'GUARIBE', nombre: 'L.B. Monseñor Crespo', codigo: 'GUA-001' },
  { municipio: 'GUARIBE', nombre: 'E.B. San José de Guaribe', codigo: 'GUA-002' },

  // 13. ORTIZ
  { municipio: 'ORTIZ', nombre: 'L.B. Ortiz', codigo: 'ORT-001' },
  { municipio: 'ORTIZ', nombre: 'E.B. Juan Germán Roscio', codigo: 'ORT-002' },

  // 14. CAMAGUÁN
  { municipio: 'CAMAGUAN', nombre: 'L.B. Esteros de Camaguán', codigo: 'CAM-001' },
  { municipio: 'CAMAGUAN', nombre: 'E.B. Puerto Miranda', codigo: 'CAM-002' },

  // 15. SAN JERÓNIMO DE GUAYABAL
  { municipio: 'GUAYABAL', nombre: 'L.B. Guayabal', codigo: 'GYB-001' },
  { municipio: 'GUAYABAL', nombre: 'E.B. Cazorla', codigo: 'GYB-002' }
];

async function seedInstituciones() {
  try {
    await syncDatabase();
    let nuevas = 0;
    for (const item of CATALOGO_GUÁRICO) {
      const [, created] = await Institucion.findOrCreate({
        where: { municipio: item.municipio, nombre: item.nombre },
        defaults: item
      });
      if (created) nuevas++;
    }
    console.log(`✅ Catálogo precargado: ${nuevas} instituciones agregadas (${CATALOGO_GUÁRICO.length} en total).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cargando catálogo de instituciones:', error);
    process.exit(1);
  }
}

seedInstituciones();
