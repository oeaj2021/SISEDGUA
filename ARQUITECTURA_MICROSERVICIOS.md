# Especificación Arquitectónica: Descomposición en Microservicios para Alta Escala (SISEDGUA)

> **CDCE Estadal Guárico** | Plataforma de Monitoreo Situacional Educativo  
> **Objetivo de Carga**: Soportar de **40.000 a 100.000+ usuarios concurrentes** mediante escalado horizontal independiente, desacoplamiento de dominios (DDD) y tolerancia a fallos aislada.

---

## 1. Visión General del Sistema y Bounded Contexts (DDD)

La arquitectura actual desacopla el monolito modular en **6 microservicios autónomos**, orquestados por un **API Gateway / Edge Proxy** y comunicados de manera reactiva mediante **Event-Driven Architecture (EDA)**:

```mermaid
flowchart TD
    subgraph Edge ["Capa Edge & Enrutamiento"]
        Clients["Clientes Móviles / Web (40k - 100k Concurrencia)"] --> Cloudflare["Cloudflare / CDN (WAF + DDoS + Edge Cache)"]
        Cloudflare --> ApiGateway["API Gateway / Reverse Proxy (Kong / Traefik / Nginx)"]
    end

    subgraph ServiceMesh ["Malla de Microservicios Autónomos"]
        ApiGateway -- "/api/v1/auth" --> AuthSvc["Auth & Security Service (:3001)"]
        ApiGateway -- "/api/v1/reportes" --> ReporteSvc["Attendance Ingestion Service (:3002)"]
        ApiGateway -- "/api/v1/instituciones" --> InstSvc["School Directory Service (:3003)"]
        ApiGateway -- "/api/v1/padron" --> PadronSvc["Staff Roster Service (:3004)"]
        ApiGateway -- "/api/v1/consejos" --> ConsejoSvc["Community Audit Service (:3005)"]
        ApiGateway -- "/api/v1/analytics" --> AnalyticsSvc["Situational Analytics Service (:3006)"]
    end

    subgraph Messaging ["Bus de Eventos Asíncronos (EDA)"]
        ReporteSvc -- "Publica: ReporteCreadoEvent" --> EventBus[("Redis Streams / RabbitMQ Message Broker")]
        EventBus -- "Consume Evento (CQRS)" --> AnalyticsSvc
    end

    subgraph Persistence ["Capa de Persistencia Independiente (Database-per-Service)"]
        AuthSvc --> DB_Auth[("PostgreSQL: auth_db")]
        ReporteSvc --> DB_Reportes[("PostgreSQL: reportes_db (Particionada por Fecha)")]
        InstSvc --> Cache_Inst[("Redis: Catalogo Cache")]
        InstSvc --> DB_Inst[("PostgreSQL: catalog_db")]
        PadronSvc --> DB_Padron[("PostgreSQL: padron_db (Trigram Indexes)")]
        ConsejoSvc --> DB_Consejos[("PostgreSQL: audit_db")]
        AnalyticsSvc --> Cache_Stats[("Redis: Proyecciones en RAM")]
        AnalyticsSvc --> DB_Analytics[("PostgreSQL: analytics_warehouse")]
    end
```

---

## 2. Catálogo Detallado de Microservicios

### 2.1. API Gateway & Edge Layer (Puerta de Entrada)
- **Tecnología**: Nginx High-Performance / Traefik / Kong Gateway.
- **Responsabilidades**:
  - Terminación SSL/TLS y compresión HTTP (Gzip/Brotli).
  - Rate Limiting distribuido (Token Bucket respaldado por Redis).
  - Verificación stateless de tokens JWT (evita que peticiones no autorizadas lleguen a los servicios internos).
  - Balanceo de carga round-robin con verificación de salud (`/health`) hacia réplicas de contenedores.
  - Enrutamiento canónico de rutas URI versionadas (`/api/v1/...`).

### 2.2. Attendance Ingestion Service (`reporte-service`)
- **Tipo de Carga**: **Ultra intensiva en escritura (Write-Heavy)** durante picos matutinos (7:00 AM - 9:30 AM) y vespertinos (1:00 PM - 2:30 PM).
- **Métricas de Escala**: 4 a 12 réplicas horizontales (Stateless).
- **Responsabilidades**:
  - Ingesta de reportes de matrícula y personal con validación contra esquema estricto (Zod/Joi).
  - Detección de reportes duplicados en tiempo constante $O(1)$ vía clave Redis: `dup:${fecha}:${turno}:${institucion_id}`.
  - Persistencia de la transacción en `reportes_db`.
  - Publicación del evento desacoplado `reporte.creado` en el bus de mensajes.
- **Contrato de API (REST)**:
  - `POST /api/v1/reportes`: Crea reporte diario. Retorna HTTP 201 en < 30ms.
  - `GET /api/v1/reportes/check-duplicado`: Valida pre-existencia en RAM (< 2ms).

### 2.3. Situational Analytics Service (`analytics-service` / CQRS)
- **Tipo de Carga**: **Ultra intensiva en lectura y agregación analítica (Read-Heavy / OLAP)**.
- **Patrón Arquitectónico**: **CQRS (Command Query Responsibility Segregation)**.
- **Responsabilidades**:
  - Escuchar eventos `reporte.creado` del Message Broker y actualizar en segundo plano tablas proyectadas y contadores atómicos en Redis (`HINCRBY`).
  - Servir métricas agregadas al Dashboard administrativo y a la barra pública sin tocar las tablas de transacciones transaccionales.
  - Evitar contención de locks en PostgreSQL.
- **Contrato de API (REST)**:
  - `GET /api/v1/analytics/conteo-hoy`: Responde desde Redis en < 2ms (TTL: 5 min).
  - `GET /api/v1/analytics/stats`: Estadísticas consolidadas estatales con filtros temporales.
  - `GET /api/v1/analytics/por-municipio`: Desglose geográfico para mapa situacional.
  - `GET /api/v1/analytics/export/excel`: Generación asíncrona de reportes pesados en streaming.

### 2.4. School Directory Service (`institucion-service`)
- **Tipo de Carga**: **Lectura masiva estática (99.9% Read-Heavy)** con mutaciones administrativas esporádicas.
- **Responsabilidades**:
  - Maestro de 1.200+ instituciones educativas de Guárico (códigos DEA, municipios, parroquias, circuitos).
  - Configuración de capacidades máximas por municipio y turno.
  - Importación/Exportación masiva en hojas de cálculo Excel.
  - Cache-Aside agresivo en Redis (TTL: 24 horas) con invalidación reactiva por patrón (`cache:inst:*`).
- **Contrato de API (REST)**:
  - `GET /api/v1/instituciones`: Consulta filtrada por municipio y turno (servida 100% de Redis).
  - `POST /api/v1/instituciones`: Alta de institución (Invalida caché).
  - `PUT /api/v1/instituciones/:id`: Modificación (Invalida caché).
  - `DELETE /api/v1/instituciones/:id`: Baja lógica/física (Invalida caché).

### 2.5. Staff Roster Service (`padron-service`)
- **Tipo de Carga**: Consultas masivas concurrentes de autocompletado en el formulario de registro.
- **Responsabilidades**:
  - Búsqueda instantánea de personal educativo (docentes, obreros, administrativos, cocineras de la patria) por Cédula de Identidad (`nacionalidad` + `cedula`).
  - Indexación PostgreSQL mediante B-Tree y `pg_trgm` para respuesta sub-milisegundo.
  - Caché de consultas calientes en Redis: `padron:${nac}:${cedula}` (TTL: 12 horas).
- **Contrato de API (REST)**:
  - `GET /api/v1/padron/consulta/:nacionalidad/:cedula`: Verificación instantánea.
  - `POST /api/v1/padron/masivo`: Carga masiva de nómina institucional.

### 2.6. Community Oversight Service (`consejos-comunales-service`)
- **Tipo de Carga**: Ingesta independiente de auditoría social y comunitaria (Poder Popular).
- **Responsabilidades**:
  - Registro de veeduría comunal, funcionamiento del comedor escolar (CNAE), servicios básicos e incidencias.
  - Totalmente aislado para que picos en el reporte escolar no degraden la auditoría comunitaria.

### 2.7. Auth & Security Service (`auth-service`)
- **Responsabilidades**:
  - Autenticación de administradores y directores de sala situacional.
  - Emisión de Json Web Tokens (JWT) firmados con algoritmo asimétrico (RS256 o HS512).
  - Bloqueo por fuerza bruta distribuido en Redis (15 intentos fallidos / 15 min).

---

## 3. Matriz de Comunicación Inter-Servicios

| Origen | Destino | Tipo de Comunicación | Protocolo / Transporte | Justificación |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | Cualquier Servicio | Síncrono | HTTP/REST / gRPC | Enrutamiento perimetral sin latencia |
| **reporte-service** | **analytics-service** | **Asíncrono (Event-Driven)** | **Redis Streams / AMQP** | **Zero-lock: La inserción no espera el cálculo analítico** |
| **reporte-service** | **Redis (Cache & Dups)** | Síncrono | Redis Protocol (RESP) | Verificación de unicidad en < 1ms |
| **institucion-service** | **Redis (Catalog)** | Síncrono | Redis Protocol (RESP) | Alivio del 100% de lecturas a PostgreSQL |
| **Cualquier Servicio** | **auth-service** | Desacoplado | Stateless JWT verification | No requiere roundtrip HTTP; valida firma criptográfica localmente |

---

## 4. Estrategia de Persistencia: Database-per-Service vs Schema-per-Service

Para la escala de 40.000 a 100.000 usuarios en infraestructura gestionada (VPS / Dokploy), se establecen dos fases de madurez:

```mermaid
graph LR
    subgraph Fase1 ["Fase 1: Schema-per-Service (Single Instance, Dedicated Schemas)"]
        PG_Instance[("PostgreSQL Server Dedicado")]
        PG_Instance --> Schema_Reportes["schema: reportes"]
        PG_Instance --> Schema_Catalogo["schema: catalogo"]
        PG_Instance --> Schema_Padron["schema: padron"]
        PG_Instance --> Schema_Auth["schema: auth"]
    end

    subgraph Fase2 ["Fase 2: Database-per-Service (Multi-Cluster / Managed DB)"]
        C_Reportes[("Cluster Reportes (Write Optimized)")]
        C_Analytics[("Cluster Analytics (Read Replicas)")]
        C_Padron[("Cluster Padrón & Catálogo")]
    end
```

1. **Fase 1 (Inmediata / Cost-Effective)**:
   - Una instancia potente de PostgreSQL con particionamiento nativo (`PARTITION BY RANGE (fecha)`).
   - Pools de conexiones independientes por microservicio (Sequelize / PgBouncer) para que ningún servicio agote las conexiones de otro.
2. **Fase 2 (Escala Masiva > 100.000 concurrentes)**:
   - Instancias RDS / Contenedores segregados con replicación primaria-secundaria (Read Replicas).

---

## 5. Manifiesto Docker Compose para Microservicios (`docker-compose.microservices.yml`)

Estructura de orquestación lista para despliegue en clúster o Dokploy:

```yaml
version: '3.8'

services:
  # -------------------------------------------------------------
  # CAPA 1: EDGE & REVERSE PROXY / API GATEWAY
  # -------------------------------------------------------------
  api-gateway:
    image: nginx:alpine
    container_name: sisedgua_gateway
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - reporte-service
      - institucion-service
      - analytics-service
    networks:
      - sisedgua_net

  # -------------------------------------------------------------
  # CAPA 2: BUS DE DATOS Y CACHÉ DISTRIBUIDA
  # -------------------------------------------------------------
  redis-broker:
    image: redis:7-alpine
    container_name: sisedgua_redis_broker
    restart: always
    command: >
      redis-server
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy noeviction
    ports:
      - "6379:6379"
    volumes:
      - sisedgua_redis_data:/data
    networks:
      - sisedgua_net

  # -------------------------------------------------------------
  # CAPA 3: MICROSERVICIOS DE NEGOCIO (STATELESS & ESCALABLES)
  # -------------------------------------------------------------
  reporte-service:
    build:
      context: ./services/reporte-service
    environment:
      - PORT=3002
      - DB_URI=postgres://sisedgua:secret@postgres-db:5432/sisedgua_db?schema=reportes
      - REDIS_URI=redis://redis-broker:6379
    deploy:
      replicas: 4  # Escalado horizontal para 40k envíos simultáneos
    depends_on:
      - redis-broker
      - postgres-db
    networks:
      - sisedgua_net

  analytics-service:
    build:
      context: ./services/analytics-service
    environment:
      - PORT=3006
      - DB_URI=postgres://sisedgua:secret@postgres-db:5432/sisedgua_db?schema=analytics
      - REDIS_URI=redis://redis-broker:6379
    deploy:
      replicas: 2
    depends_on:
      - redis-broker
      - postgres-db
    networks:
      - sisedgua_net

  institucion-service:
    build:
      context: ./services/institucion-service
    environment:
      - PORT=3003
      - DB_URI=postgres://sisedgua:secret@postgres-db:5432/sisedgua_db?schema=catalogo
      - REDIS_URI=redis://redis-broker:6379
    deploy:
      replicas: 2
    depends_on:
      - redis-broker
      - postgres-db
    networks:
      - sisedgua_net

  # -------------------------------------------------------------
  # CAPA 4: PERSISTENCIA CENTRALIZADA
  # -------------------------------------------------------------
  postgres-db:
    image: postgres:16-alpine
    container_name: sisedgua_postgres
    restart: always
    environment:
      POSTGRES_DB: sisedgua_db
      POSTGRES_USER: sisedgua
      POSTGRES_PASSWORD: secret_password_here
    volumes:
      - sisedgua_pg_data:/var/lib/postgresql/data
    networks:
      - sisedgua_net

volumes:
  sisedgua_pg_data:
  sisedgua_redis_data:

networks:
  sisedgua_net:
    driver: bridge
```

---

## 6. Plan de Transición por Fases (Monolito Modular a Microservicios)

Para evitar disrupciones operativas en la recolección diaria de datos del CDCE Guárico:

1. **Fase Actual (Implementada en `feat/redis-caching-and-performance`)**:
   - Monolito modular optimizado con Redis 7 (Cache-Aside), índices compuestos B-Tree y rate limit distribuido. Sostiene 40.000 usuarios con bajo costo de infraestructura.
2. **Fase Transición (Extracción de Dominio Ingesta / CQRS)**:
   - Desacoplar el controlador `reporteController.js` y `dashboardController.js` hacia un canal de eventos en Redis Streams.
   - Las lecturas de estadísticas se alimentan de proyecciones precalculadas en memoria.
3. **Fase Microservicios Completos (Despliegue Contenerizado Independiente)**:
   - Despliegue de los contenedores segregados con Docker Compose o Kubernetes (K3s).
   - Monitoreo distribuido con Prometheus y Grafana (latencia p99, tasa de errores y saturation de queues).
