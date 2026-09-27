# 🚀 SISEDGUA v2.0 — Sistema Integral de Seguimiento Educativo
**Zona Educativa del Estado Guárico | Arquitectura DDD, Agentes Autónomos & Antigravity HUD**

Esta carpeta contiene la implementación completa e independiente de la **versión 2.0 de SISEDGUA**. Está aislada del sistema en producción (`/backend` y `/frontend`) y corre sobre puertos y contenedores independientes.

---

## 🏗️ Estructura del Proyecto v2

```text
sisedgua-v2/
├── agents/                       # Ecosistema de Subagentes Autónomos
│   ├── AgentOrchestrator.js      # Orquestador y despachador de tareas
│   ├── AuditIntegrityGuardian.js # Guardián de consistencia y anomalías estadísticas
│   ├── TerritorialGeoAnalyst.js  # Analista de cobertura geográfica (15 municipios)
│   └── DatabasePerformanceAgent.js # Monitor de telemetría y salud de BD
├── skills/                       # Skills de Agente en formato estándar
│   ├── sisedgua-data-audit/SKILL.md
│   ├── sisedgua-geo-analytics/SKILL.md
│   ├── sisedgua-db-optimizer/SKILL.md
│   └── sisedgua-antigravity-ui/SKILL.md
├── backend/                      # Backend Modular DDD
│   ├── src/
│   │   ├── domain/               # Entidades y Reglas de Negocio
│   │   ├── application/          # Casos de Uso y Servicios de Dominio
│   │   ├── infrastructure/       # Repositorios SQL y Conexiones
│   │   └── presentation/         # Controladores y Rutas API
│   ├── package.json
│   └── .env.example
├── frontend/                     # Frontend Antigravity HUD
│   ├── src/
│   │   ├── components/           # Componentes Glassmorphic & Tactical Cards
│   │   ├── pages/                # Dashboard de Sala Situacional v2
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── docker-compose.v2.yml         # Orquestación aislada (Puertos 5001 / 3001)
```

---

## ⚡ Guía de Ejecución Rápida (Sin interferir con producción)

### 1. Variables de Entorno
```bash
cp backend/.env.example backend/.env
```

### 2. Ejecución con Docker Compose
```bash
docker compose -f docker-compose.v2.yml up --build -d
```
- **Backend API v2:** `http://localhost:5001/api/v2`
- **Frontend HUD v2:** `http://localhost:3001`
- **Consola de Subagentes:** `http://localhost:5001/api/v2/agents/status`
