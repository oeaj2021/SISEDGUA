# 📚 SISEDGUA API - Documentación Completa

**Versión:** 1.0.0  
**Última actualización:** 2026-09-29  
**Estado:** ✅ Producción

---

## 📖 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints de Reportes](#endpoints-de-reportes)
4. [Endpoints de Dashboard](#endpoints-de-dashboard)
5. [Endpoints de Instituciones](#endpoints-de-instituciones)
6. [Endpoints de Consejos Comunales](#endpoints-de-consejos-comunales)
7. [Códigos de Error](#códigos-de-error)
8. [Rate Limiting](#rate-limiting)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

**SISEDGUA** es la API REST del Sistema de Sala Situacional del Centro de Control de Estudios Educativo (CDCE) del Estado Guárico.

### URLs de Acceso

- **Desarrollo**: `http://localhost:3001/api`
- **Producción**: `https://sisedgua.guarico.gob.ve/api`
- **Documentación Interactiva**: `/api/docs` (Swagger UI)
- **Spec OpenAPI**: `/api/docs.json`

### Características

- ✅ Autenticación JWT con tokens de 8 horas
- ✅ Rate limiting distribuido con Redis
- ✅ Caché inteligente para optimización
- ✅ Validación automática con Zod schemas
- ✅ Timestamps automáticos del servidor
- ✅ Soporte multi-municipio
- ✅ Exportación a Excel

---

## Autenticación

Todos los endpoints protegidos requieren un token JWT válido en el header `Authorization`.

### POST /auth/login

Obtiene un token JWT válido por **8 horas**.

**Request:**
```json
{
  "email": "admin@sisedgua.ve",
  "password": "okmLIqlAFOWzIg@2026!"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@sisedgua.ve",
    "nombre": "Administrador Sala Situacional CDCE ESTADAL GUÁRICO"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas
- `429`: Demasiados intentos (rate limit: 15 intentos/15 min)

### Uso del Token

Incluir en todas las solicitudes protegidas:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://sisedgua.guarico.gob.ve/api/dashboard/stats
```

---

## Endpoints de Reportes

### POST /reportes

Registra un nuevo reporte de asistencia escolar.

**⚠️ Restricciones:**
- Solo entre **4:00 AM - 6:00 PM** (horario escolar)
- Rate limit: **50 reportes cada 15 minutos** por IP
- La **fecha de registro** es automática del servidor (NO la del cliente)

**Request:**
```json
{
  "turno": "MAÑANA",
  "municipio": ["ROSCIO", "ORTIZ"],
  "fecha": "2026-09-29",
  "nombre_director": "Juan Pérez García",
  "cedula": "12345678",
  "telefono": "+58 (289) 123-4567",
  "nombre_institucion": "Escuela Bolivariana Venezuela",
  "institucion_id": null,
  "matricula_asistente": 45,
  "matricula_inasistente": 5,
  "docentes_asistente": 12,
  "docentes_inasistente": 1,
  "admin_asistente": 3,
  "admin_inasistente": 0,
  "obrero_asistente": 8,
  "obrero_inasistente": 1,
  "cocina_asistente": 4,
  "cocina_inasistente": 0,
  "incidencias": "Sin incidencias"
}
```

**Response (201 Created):**
```json
{
  "ok": true,
  "mensaje": "Reporte registrado exitosamente",
  "id": 1234
}
```

**Errores:**
- `400`: Validación fallida
- `403`: Fuera de horario
- `429`: Límite de reportes excedido
- `500`: Error del servidor

---

### GET /reportes/check-duplicado

Verifica si existe un reporte duplicado.

**Query Parameters:**
```
?nombre_institucion=Escuela Bolivariana&fecha=2026-09-29&turno=MAÑANA
```

**Response (200):**
```json
{
  "duplicado": false
}
```

---

### GET /reportes/conteo-hoy

Conteo de reportes por municipio registrados hoy.

**Query Parameters:**
```
?turno=MAÑANA&municipio=ROSCIO
```

**Response (200):**
```json
[
  {
    "municipio": "ROSCIO",
    "total": 12,
    "manana": 8,
    "tarde": 4,
    "total_instituciones": 25
  },
  {
    "municipio": "ORTIZ",
    "total": 9,
    "manana": 6,
    "tarde": 3,
    "total_instituciones": 18
  }
]
```

---

## Endpoints de Dashboard

**Todos requieren autenticación JWT**

### GET /dashboard/stats

Estadísticas generales del dashboard (con cache de 60 seg).

**Query Parameters:**
```
?fecha=2026-09-29&municipio=ROSCIO
```

**Response (200):**
```json
{
  "total_reportes": 234,
  "cant_instituciones_reportadas": 87,
  "total_instituciones": 150,
  "reportadas_display": "87 de 150 instituciones",
  "estudiantes_asistente": 12450,
  "estudiantes_inasistente": 550,
  "pct_asistencia": 95.8,
  "docentes_asistente": 890,
  "docentes_inasistente": 45,
  "admin_asistente": 120,
  "admin_inasistente": 8,
  "obrero_asistente": 340,
  "obrero_inasistente": 25,
  "cocina_asistente": 280,
  "cocina_inasistente": 12,
  "total_alimentacion": 13980,
  "pct_alimentacion": 98.5,
  "total_estudiantes": 13000
}
```

---

### GET /dashboard/por-municipio

Estadísticas desglosadas por municipio (cache 60 seg).

**Response (200):**
```json
[
  {
    "municipio": "ROSCIO",
    "total_reportes": 45,
    "estudiantes_asistente": 2340,
    "estudiantes_inasistente": 110,
    "pct_asistencia": 95.5,
    "reportes": 32,
    "total_instituciones": 45,
    "instituciones_display": "32 de 45 instituciones"
  },
  {
    "municipio": "ORTIZ",
    "total_reportes": 38,
    "estudiantes_asistente": 1980,
    "estudiantes_inasistente": 95,
    "pct_asistencia": 95.4,
    "reportes": 28,
    "total_instituciones": 38,
    "instituciones_display": "28 de 38 instituciones"
  }
]
```

---

### GET /dashboard/tendencia

Evolución temporal de asistencia (últimos N días).

**Query Parameters:**
```
?dias=7&municipio=ROSCIO
```

**Response (200):**
```json
[
  {
    "fecha": "2026-09-23",
    "total_reportes": 210,
    "pct_asistencia": 94.2,
    "total_alimentacion": 12340
  },
  {
    "fecha": "2026-09-24",
    "total_reportes": 225,
    "pct_asistencia": 95.1,
    "total_alimentacion": 13100
  },
  {
    "fecha": "2026-09-29",
    "total_reportes": 234,
    "pct_asistencia": 95.8,
    "total_alimentacion": 13980
  }
]
```

---

### GET /dashboard/reportes

Lista paginada de reportes detallados.

**Query Parameters:**
```
?page=1&limit=50&fecha=2026-09-29&municipio=ROSCIO&turno=MAÑANA
```

**Response (200):**
```json
{
  "total": 1234,
  "page": 1,
  "limit": 50,
  "pages": 25,
  "data": [
    {
      "id": 1234,
      "turno": "MAÑANA",
      "municipio": ["ROSCIO"],
      "fecha": "2026-09-29",
      "created_at": "2026-09-29T08:45:32.000Z",
      "nombre_institucion": "Escuela Bolivariana Venezuela",
      "nombre_director": "Juan Pérez García",
      "cedula": "12345678",
      "matricula_asistente": 45,
      "matricula_inasistente": 5,
      "incidencias": "Sin incidencias"
    }
  ]
}
```

**⚠️ Nota sobre fechas:**
- `fecha`: Fecha del formulario (enviada por el cliente)
- `created_at`: Fecha/hora de registro en el servidor (automática)

---

## Endpoints de Instituciones

### GET /instituciones

Catálogo completo de instituciones (público, cache 300 seg).

**Query Parameters:**
```
?municipio=ROSCIO&search=Bolivariana
```

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "Escuela Bolivariana Venezuela",
    "municipio": "ROSCIO",
    "tipo": "PRIMARIA",
    "capacidad": 500,
    "activo": true,
    "created_at": "2026-01-15T00:00:00.000Z"
  }
]
```

---

### POST /instituciones

Crear nueva institución (requiere autenticación).

**Request:**
```json
{
  "nombre": "Escuela Bolivariana Guárico",
  "municipio": "ROSCIO",
  "tipo": "SECUNDARIA",
  "capacidad": 800
}
```

---

### GET /instituciones/export/excel

Descargar catálogo en Excel (requiere autenticación).

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://sisedgua.guarico.gob.ve/api/instituciones/export/excel \
  -o instituciones.xlsx
```

---

### POST /instituciones/import/excel

Importar instituciones desde Excel (requiere autenticación).

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "archivo=@instituciones.xlsx" \
  https://sisedgua.guarico.gob.ve/api/instituciones/import/excel
```

---

## Endpoints de Consejos Comunales

### POST /consejos-comunales

Registrar consejo comunal (público, sin restricción de horario).

**Request:**
```json
{
  "municipio": "ROSCIO",
  "nombre_comunidad": "Comunidad La Esperanza",
  "nombre_responsable": "María García López",
  "cedula_responsable": "12345678",
  "telefono": "+58 (289) 456-7890",
  "actividades": "Limpieza de calles, charlas educativas",
  "asistentes": 45
}
```

**Response (201):**
```json
{
  "ok": true,
  "mensaje": "Registro de consejo comunal creado exitosamente",
  "id": 567
}
```

---

### GET /consejos-comunales/stats

Estadísticas de consejos comunales (público, cache 120 seg).

**Query Parameters:**
```
?municipio=ROSCIO&fecha=2026-09-29
```

**Response (200):**
```json
[
  {
    "municipio": "ROSCIO",
    "total_registros": 12,
    "total_asistentes": 340,
    "promedio_asistentes": 28.3
  }
]
```

---

### GET /consejos-comunales

Listar registros (requiere autenticación, cache 60 seg).

**Query Parameters:**
```
?page=1&limit=50&municipio=ROSCIO&fecha=2026-09-29
```

---

### GET /consejos-comunales/export/excel

Exportar registros a Excel (requiere autenticación).

---

## Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| `400` | Bad Request - Validación fallida | Verificar campos requeridos y formatos |
| `401` | Unauthorized - Token inválido/expirado | Hacer login nuevamente |
| `403` | Forbidden - Fuera de horario/sin permisos | Intentar en horario 4:00 AM - 6:00 PM |
| `404` | Not Found - Recurso no existe | Verificar ID o ruta |
| `429` | Too Many Requests - Rate limit excedido | Esperar 15 minutos |
| `500` | Internal Server Error | Contactar soporte |

---

## Rate Limiting

### Límites por Tipo de Operación

| Operación | Límite | Ventana |
|-----------|--------|---------|
| General | 3000 req | 15 min |
| Login | 15 intentos | 15 min |
| Reportes | 50 envíos | 15 min |
| Consultas | 120 consultas | 1 min |

### Headers de Rate Limit

Todas las respuestas incluyen:
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 48
X-RateLimit-Reset: 1695990000
```

---

## Ejemplos de Uso

### Ejemplo 1: Login y Obtener Stats

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sisedgua.ve","password":"okmLIqlAFOWzIg@2026!"}' \
  | jq -r '.token')

# 2. Obtener estadísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/dashboard/stats?fecha=2026-09-29
```

### Ejemplo 2: Registrar Reporte

```bash
curl -X POST http://localhost:3001/api/reportes \
  -H "Content-Type: application/json" \
  -d '{
    "turno": "MAÑANA",
    "municipio": ["ROSCIO"],
    "fecha": "2026-09-29",
    "nombre_director": "Juan Pérez",
    "cedula": "12345678",
    "telefono": "+58 (289) 123-4567",
    "nombre_institucion": "Escuela Bolivariana",
    "matricula_asistente": 45,
    "matricula_inasistente": 5,
    "incidencias": "Sin incidencias"
  }'
```

### Ejemplo 3: Registrar Consejo Comunal

```bash
curl -X POST http://localhost:3001/api/consejos-comunales \
  -H "Content-Type: application/json" \
  -d '{
    "municipio": "ROSCIO",
    "nombre_comunidad": "Comunidad La Esperanza",
    "nombre_responsable": "María García",
    "telefono": "+58 (289) 456-7890",
    "actividades": "Charlas educativas",
    "asistentes": 45
  }'
```

---

## 📋 Health Check

**GET /api/health**

Verifica el estado del servidor.

```json
{
  "status": "ok",
  "app": "SISEDGUA API",
  "institution": "Sala Situacional CDCE ESTADAL GUÁRICO",
  "uptime": 3456.123,
  "timestamp": "2026-09-29T11:29:15.379Z",
  "timezone": "America/Caracas"
}
```

---

## 📞 Soporte

- **Email**: admin@sisedgua.ve
- **Institución**: Centro de Control de Estudios Educativo (CDCE)
- **Estado**: Guárico, Venezuela

---

**Documentación generada automáticamente con Swagger/OpenAPI**  
Acceder a `/api/docs` para interfaz interactiva
