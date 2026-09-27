---
name: sisedgua-data-audit
description: Audita la consistencia, veracidad e integridad de los reportes de matrícula, personal y comedores escolares en SISEDGUA.
risk: safe
source: sisedgua-internal
date_added: "2026-09-27"
---

# SISEDGUA Data Audit Skill

## Propósito
Detectar anomalías estadísticas, duplicidad de reportes y desbalances operacionales en los datos cargados por directores de planteles en el estado Guárico.

## Reglas de Auditoría
1. **Ratio de Asistencia Extrema**: Si `matricula_asistente / (matricula_asistente + matricula_inasistente) < 0.20` o `> 0.98`, clasificar como `INSPECTION_REQUIRED`.
2. **Desbalance Comedor/Cocineras (CNAE)**: Si `cocina_asistente = 0` pero `matricula_asistente > 150`, alertar por posible falta de suministro alimentario escolar.
3. **Turnos Inconsistentes**: Alertar si un plantel reporta doble turno idéntico con el mismo número de cédula en menos de 10 minutos.

## Salida Estructurada
Retornar un objeto JSON con:
- `anomalies`: lista de reportes con flags de severidad (`LOW`, `MEDIUM`, `CRITICAL`).
- `duplicateCount`: total de duplicados potenciales detectados.
- `recommendedActions`: lista de acciones automáticas sugeridas.
