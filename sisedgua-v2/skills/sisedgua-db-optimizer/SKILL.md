---
name: sisedgua-db-optimizer
description: Monitorea y aplica optimizaciones en PostgreSQL para SISEDGUA v2 sin bloqueos de tabla.
risk: safe
source: sisedgua-internal
date_added: "2026-09-27"
---

# SISEDGUA DB Optimizer Skill

## Principios de Rendimiento
1. **Zero In-Memory Aggregations**: Prohibido el uso de `findAll()` seguido de `reduce()` para reportes masivos.
2. **Índices Compuestos**: Todo filtrado habitual `(fecha, turno, institucion_id)` debe contar con índice B-Tree dedicado.
3. **No `alter: true` en Producción**: Usar migraciones con locks controlados (`CREATE INDEX CONCURRENTLY`).
4. **Pool Size Ajustado**: Configurar `max: 20`, `min: 5`, `idle: 10000` en Sequelize/pg-pool para balancear concurrencia en horas pico.
