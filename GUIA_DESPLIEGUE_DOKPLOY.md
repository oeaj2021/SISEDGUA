# 🚀 Guía de Despliegue de SISEDGUA en Dokploy (VPS Privado)

Esta guía te muestra el proceso paso a paso para desplegar **SISEDGUA** en tu VPS utilizando **Dokploy**.

---

## 📋 Requisitos Previos

1. **VPS con Dokploy instalado y activo** (por ejemplo: Traefik habilitado para SSL automático).
2. **Dominio o Subdominio** apuntando a la IP pública de tu VPS (ejemplo: `asistencia.tudominio.com` con registro tipo `A` en tu DNS).
3. **Repositorio Git** con el código de SISEDGUA (GitHub, GitLab o Git privado) o acceso directo para pegar el `docker-compose.yml`.

---

## 🛠️ Método Recomendado: Despliegue mediante Docker Compose en Dokploy

Este método levanta en una misma red privada aislada:
- **PostgreSQL 16** (Base de datos con volumen persistente)
- **Backend Node.js/Express** (API REST, control de horarios y exportador Excel)
- **Frontend React/Nginx** (Aplicación web pública y dashboard)

---

### Paso 1: Crear el Servicio Compose en Dokploy

1. Inicia sesión en tu panel de **Dokploy**.
2. Selecciona tu **Proyecto** (o crea uno nuevo llamado `Educacion-Guarico`).
3. Haz clic en **Create Service** y selecciona **Compose**.
4. Nombra el servicio: `sisedgua`.

---

### Paso 2: Vincular el Código Fuente

Tienes dos formas de vincularlo en la pestaña **General**:

#### Opción A: Desde Repositorio Git (Recomendada para CI/CD)
- **Repository Provider**: GitHub / GitLab / Git.
- **Repository**: `tu-usuario/SISEDGUA`.
- **Branch**: `master`.
- **Compose Path**: `./docker-compose.yml`.

#### Opción B: Raw Compose (Pegado Directo)
Si prefieres no usar Git en Dokploy, selecciona **Raw** y copia el contenido del archivo `docker-compose.yml`.

---

### Paso 3: Configurar Variables de Entorno (Environment)

En la pestaña **Environment** de tu servicio en Dokploy, agrega las siguientes variables para producción:

```env
# Base de Datos
DB_NAME=sisedgua
DB_USER=sisedgua_admin
DB_PASS=CreaUnaContrasenaMuyFuerte2026!

# Clave Criptográfica para Sesiones del Dashboard
JWT_SECRET=genera_una_clave_larga_y_aleatoria_para_produccion_2026

# Zona Horaria Oficial
TZ=America/Caracas
```

> ⚠️ **Importante**: No uses contraseñas por defecto en un servidor público. El archivo `.gitignore` ya protege que estas claves nunca se suban a tu repositorio público.

---

### Paso 4: Configurar Dominio y Certificado SSL

1. En la pestaña **Domains** del servicio Compose en Dokploy, haz clic en **Add Domain**.
2. **Host**: `asistencia.tudominio.com` (o el subdominio que configuraste en tu DNS).
3. **Service**: Selecciona `frontend` (es el contenedor Nginx que sirve la app y redirige las llamadas `/api/` al backend).
4. **Port**: `80`.
5. **Certificate**: Selecciona **Let's Encrypt** para generar automáticamente HTTPS gratuito.
6. Guarda los cambios.

---

### Paso 5: Desplegar la Aplicación

1. Haz clic en el botón **Deploy**.
2. Dokploy compilará las imágenes de Docker:
   - Construirá el backend instalando dependencias de producción.
   - Construirá el frontend optimizado con Vite y lo empaquetará en Nginx.
   - Descargará e iniciará PostgreSQL 16 con verificación de salud (*healthcheck*).
3. Monitorea los logs en la pestaña **Deployments** hasta ver el estado **Active / Running**.

---

### Paso 6: Inicializar la Base de Datos (Seeds)

Una vez que los contenedores estén corriendo, debes precargar el **Catálogo Escolar de Municipios** y crear el **Usuario Administrador**:

1. En Dokploy, ve a la pestaña **Services** o abre la terminal de tu VPS por SSH.
2. Ejecuta el comando de seeding en el contenedor del backend:

```bash
docker exec -it sisedgua_backend npm run seed
```

> **Salida esperada:**
> ```
> ✅ Conexión a PostgreSQL establecida con éxito.
> ✅ Tablas sincronizadas con PostgreSQL.
> ✅ Catálogo precargado: 45 instituciones agregadas.
> ✅ Usuario Administrador inicial creado exitosamente: admin@sisedgua.ve
> ```

---

## 🔑 Credenciales Iniciales de Administración

- **Panel de Acceso**: `https://asistencia.tudominio.com/login`
- **Usuario**: `admin@sisedgua.ve`
- **Contraseña**: `Admin2026!`

---

## 🌐 URLs Públicas del Sistema en Producción

| Ruta | Propósito | Horario de Acceso |
|---|---|---|
| `https://asistencia.tudominio.com/manana` | Formulario público Turno Mañana | 07:00 AM – 12:00 PM |
| `https://asistencia.tudominio.com/tarde` | Formulario público Turno Tarde | 01:00 PM – 10:00 PM |
| `https://asistencia.tudominio.com/login` | Acceso Administradores | 24 horas |
| `https://asistencia.tudominio.com/dashboard` | Tablero Analítico y Reporte Excel | 24 horas (Con Login) |
| `https://asistencia.tudominio.com/api/health` | Verificación de Estado / Uptime | 24 horas |

---

## 💡 Mantenimiento y Respaldos

### 1. Respaldar la Base de Datos
Desde la terminal de tu VPS:
```bash
docker exec sisedgua_postgres pg_dump -U sisedgua_admin sisedgua > respaldo_sisedgua_$(date +%Y%m%d).sql
```

### 2. Restaurar Respaldo
```bash
cat respaldo.sql | docker exec -i sisedgua_postgres psql -U sisedgua_admin -d sisedgua
```

### 3. Actualizaciones de Código
Cada vez que hagas un `git push` a tu rama `master`, puedes pulsar **Redeploy** en Dokploy o activar el **Webhook de Git** en Dokploy para despliegues automáticos continuos.
