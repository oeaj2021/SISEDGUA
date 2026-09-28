# 📊 INFORME TÉCNICO: ANÁLISIS FORENSE DE LOGS Y PLAN DE ESCALABILIDAD (1,000 - 2,000 USUARIOS)

**Proyecto:** SISEDGUA - Sala Situacional CDCE Estadal Guárico  
**Fecha:** 28 de Septiembre de 2026  
**Severidad:** Crítica (Denegación de servicio por cascada HTTP 429)  
**Estado:** Diagnóstico completado — Branch de trabajo: `perf/optimize-concurrency-1000-users`

---

## 1. 🔍 DIAGNÓSTICO FORENSE DE LOS LOGS

### 1.1 Resumen de la Muestra
- **Ventana de tiempo analizada:** `11:32:00 UTC` a `11:33:08 UTC` (68 segundos).
- **Tráfico:** Más de 50 peticiones HTTP en poco más de un minuto provenientes de múltiples navegadores móviles (Chrome Mobile, SamsungBrowser) y distintos operadores nacionales (CANTV, Digitel, Movistar, Inter).
- **Síntoma Principal:** Prácticamente el 100% de las solicitudes a endpoints de la API (`/api/*`) devuelven el código de estado HTTP **`429 Too Many Requests`** con un cuerpo de 76 bytes.

### 1.2 Comportamiento por Tipo de Recurso
| Recurso | Código HTTP | Tamaño | Diagnóstico |
|---|:---:|:---:|---|
| `/assets/index-*.js`, `.css` | `200 OK` | 867 KB / 35 KB | Los activos estáticos se sirven correctamente desde el proxy reverso / frontend. |
| `/cde-guarico-*.png` | `200 OK` | 81 KB / 95 KB | Las imágenes cargan sin problemas. |
| `/manana` (HTML SPA) | `200 OK` | 967 B | La ruta raíz de la aplicación web responde adecuadamente. |
| `GET /api/reportes/conteo-hoy` | **`429 Too Many Requests`** | 76 B | **BLOQUEADO.** Llamada masiva desde el componente de cabecera. |
| `GET /api/instituciones?municipio=...` | **`429 Too Many Requests`** | 76 B | **BLOQUEADO.** Los directores no pueden cargar las listas desplegables. |
| `POST /api/reportes` | **`429 Too Many Requests`** | 76 B | **BLOQUEO CRÍTICO.** Los directores no pueden guardar sus reportes (ej. IP `190.103.29.216` intentó 4 veces en 13 segundos y fue rechazada). |

---

## 2. 💥 CAUSA RAÍZ (ROOT CAUSE ANALYSIS - RCA)

Tras auditar el código fuente en `backend/src/app.js` y `frontend/src/components/ConteoMunicipiosBar.jsx`, se identificaron **tres fallas de diseño combinadas**:

### Causa 1: Colapso de IPs por configuración errónea de Reverse Proxy
* En `backend/src/app.js` (Línea 24):
  ```javascript
  app.set('trust proxy', 1);
  ```
* En infraestructuras con Docker, Dokploy o Traefik, las peticiones pasan a través de múltiples saltos de red internos (`10.0.1.7`). Al configurar `trust proxy: 1`, Express evalúa `req.ip` tomando únicamente el primer salto inmediato.
* **Efecto:** Todas las conexiones de directores de escuelas en todo el estado Guárico (a pesar de tener IPs públicas diferentes como `190.89.30.192`, `161.22.38.254`, etc.) fueron asignadas a **una sola y misma IP virtual en memoria (`10.0.1.7`)**.

### Causa 2: Aplicación indiscriminada de `submitLimiter` sobre endpoints de lectura
* En `backend/src/app.js` (Línea 75-81 y Línea 98):
  ```javascript
  const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 envíos de formulario cada 15 min por IP
    ...
  });

  // ERROR: submitLimiter se aplicó a TODO el router /api/reportes
  app.use('/api/reportes', submitLimiter, reportesRoutes);
  ```
* En `backend/src/routes/reportes.js`:
  ```javascript
  router.post('/', horario, ctrl.create);
  router.get('/check-duplicado', ctrl.checkDuplicado);
  router.get('/conteo-hoy', ctrl.getConteoHoy); // <- HEREDA submitLimiter
  ```
* En el frontend (`ConteoMunicipiosBar.jsx`):
  ```javascript
  useEffect(() => {
    cargarConteo(); // GET /api/reportes/conteo-hoy
    const timer = setInterval(cargarConteo, 30000); // Polling cada 30s
    return () => clearInterval(timer);
  }, []);
  ```
* **Efecto Domino:**
  1. 50 usuarios abrieron la página en menos de 15 segundos.
  2. Cada usuario ejecutó `GET /api/reportes/conteo-hoy`.
  3. Como para el backend todos compartían la IP `10.0.1.7`, **el límite de 50 peticiones se consumió instantáneamente**.
  4. A partir de ese segundo, ningún director pudo enviar su reporte (`POST /api/reportes`) porque quedó dentro del mismo router estrangulado.

### Causa 3: Agotamiento del `generalLimiter`
* En `app.js` (Línea 61):
  ```javascript
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    ...
  });
  app.use('/api/', generalLimiter);
  ```
* Al llegar a 300 peticiones globales en menos de 5 minutos, **toda la API quedó bloqueada**, impidiendo incluso consultar `/api/instituciones`.

---

## 3. 🚀 ARQUITECTURA DE ESCALABILIDAD (1,000 - 2,000 USUARIOS CONCURRENTES)

### 3.1 Análisis de Carga Matemática
Si 2,000 directores y supervisores ingresan simultáneamente:
- **Sin Caché (Estado Actual):**  
  2,000 usuarios $\times$ 1 petición cada 30s = **~66.7 peticiones SQL/segundo** a PostgreSQL ejecutando `findAll()` con conteos agregados.  
  *Resultado:* PostgreSQL colapsa el pool por defecto de Sequelize (5 conexiones) en menos de 3 segundos y la CPU sube al 100%.
- **Con Caché en Memoria (Propuesta):**  
  2,000 usuarios consultan la API $\rightarrow$ 1 sola consulta SQL a PostgreSQL cada 15 segundos $\rightarrow$ 1,999 peticiones se responden desde RAM en **< 2 milisegundos**.

---

## 4. 🛠️ PLAN DE ACCIÓN Y CAMBIOS TÉCNICOS PROPUESTOS

### Medida 1: Corrección de `trust proxy` y desacople de Rate Limiters
En `backend/src/app.js`:
1. Configurar `app.set('trust proxy', true)` o función extractora de IP (`req.headers['x-forwarded-for'] || req.ip`).
2. Desvincular `submitLimiter` del prefijo `/api/reportes` y aplicarlo **únicamente** a la ruta de mutación:
   ```javascript
   // backend/src/routes/reportes.js
   router.post('/', submitLimiter, horario, ctrl.create);
   router.get('/check-duplicado', ctrl.checkDuplicado);
   router.get('/conteo-hoy', ctrl.getConteoHoy); // Libre de submitLimiter
   ```
3. Aumentar el `generalLimiter` a valores acordes a 2,000 usuarios:
   ```javascript
   const generalLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 3000, // Permite navegación fluida por IP real
     standardHeaders: true,
     legacyHeaders: false
   });
   ```

### Medida 2: Micro-Caché en Memoria para `getConteoHoy`
En `backend/src/controllers/reporteController.js`:
Implementar un mecanismo de caché en memoria con TTL de 15 segundos:
```javascript
let cacheConteo = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15000; // 15 segundos

exports.getConteoHoy = async (req, res) => {
  const ahora = Date.now();
  if (cacheConteo && (ahora - cacheTimestamp) < CACHE_TTL_MS) {
    return res.json(cacheConteo);
  }

  // Si venció el TTL, realiza la consulta y actualiza la caché
  const resultado = await calcularConteoHoy();
  cacheConteo = resultado;
  cacheTimestamp = ahora;
  return res.json(resultado);
};
```
*Además, cuando alguien realiza un `POST /api/reportes` exitoso, se invalida inmediatamente `cacheConteo = null` para que el conteo se actualice en tiempo real.*

### Medida 3: Dimensionamiento del Pool de Conexiones PostgreSQL
En `backend/src/config/database.js`:
Sequelize por defecto asigna solo 5 conexiones. Para 2,000 usuarios concurrentes:
```javascript
pool: {
  max: 30,          // Conexiones simultáneas máximas en PostgreSQL
  min: 5,           // Conexiones mínimas activas
  acquire: 30000,   // Tiempo máx para esperar conexión (30s)
  idle: 10000       // Tiempo máx de inactividad antes de liberar
}
```

### Medida 4: Optimización del Polling en Frontend
En `frontend/src/components/ConteoMunicipiosBar.jsx`:
1. Aumentar el intervalo de sondeo a 60 segundos con **Jitter aleatorio** ($\pm 5$s) para dispersar las peticiones y evitar el *Thundering Herd Problem*.
2. Pausar el polling si la pestaña está en segundo plano o el usuario tiene la pantalla bloqueada:
   ```javascript
   if (document.hidden) return; // No saturar si el usuario no está viendo la app
   ```

### Medida 5: Concurrencia Multi-Núcleo en Node.js
Node.js corre en un solo hilo de ejecución. Para soportar picos masivos:
- Levantar la aplicación usando **PM2 en modo cluster**:
  ```bash
  pm2 start src/app.js -i max --name sisedgua-backend
  ```
  O definir réplicas en `docker-compose.yml` detrás de Traefik.

---

## 5. 📋 MATRIZ DE RIESGO Y ESTADO ACTUAL

| Componente | Estado Previo | Impacto con 2,000 Usuarios | Estado con las Optimizaciones |
|---|---|---|---|
| **Rate Limiter Proxy** | Colapso total a 50 peticiones globales | Caída del 100% de los usuarios | Aislado por IP real de cada cliente |
| **Consultas Conteo** | 67 queries/segundo a PostgreSQL | Saturación de CPU y Timeout en DB | 1 query cada 15s (servido desde RAM en 1ms) |
| **Pool de Conexiones** | 5 conexiones fijas | Bloqueo de hilos Sequelize | 30 conexiones dinámicas |
| **Envío de Reportes** | Bloqueado por 429 | Pérdida de datos escolares | Envíos fluidos con reintentos limpios |

---

*Nota de Seguridad:* Toda la base de código actual se mantiene intacta en `master`. Las propuestas de optimización han sido preparadas para ser aplicadas en la rama `perf/optimize-concurrency-1000-users` sin realizar ningún push al repositorio remoto según las instrucciones.
