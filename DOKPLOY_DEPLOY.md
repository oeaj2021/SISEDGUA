# Despliegue en Dokploy (VPS Privado) — SISEDGUA

SISEDGUA está preparado para desplegarse en tu VPS usando **Dokploy** de dos maneras posibles:

---

## Opción 1: Despliegue vía Docker Compose (Recomendada)

En el panel de tu VPS en Dokploy:
1. Ve a tu proyecto y selecciona **Create Service** -> **Compose**.
2. Nombre del servicio: `sisedgua`.
3. Fuente: Selecciona tu repositorio Git (GitHub/GitLab) o pega directamente el contenido del archivo `docker-compose.yml`.
4. En la pestaña **Environment**, define las variables de entorno de producción:
   ```env
   DB_NAME=sisedgua
   DB_USER=sisedgua_user
   DB_PASS=tu_contraseña_segura_aqui
   JWT_SECRET=tu_clave_jwt_aleatoria_super_secreta
   ```
5. En **Domains**, apunta tu dominio o subdominio al servicio `frontend` en el puerto `80`.
6. Haz clic en **Deploy**.

---

## Opción 2: Despliegue por Servicios Separados en Dokploy

Si prefieres usar la base de datos gestionada de Dokploy:
1. **Database**: Crea una base de datos PostgreSQL en Dokploy (`sisedgua`).
2. **Backend**:
   - Crea una aplicación tipo **Application** basada en Dockerfile apuntando al directorio `/backend`.
   - Asigna las variables de entorno de conexión a la BD: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`.
   - Ejecuta el comando de seed inicial en la consola del contenedor:
     ```bash
     npm run seed
     ```
3. **Frontend**:
   - Crea una aplicación tipo **Application** basada en Dockerfile apuntando al directorio `/frontend`.
   - Configura el dominio público con certificado SSL automático (Let's Encrypt).

---

## Comandos Útiles de Mantenimiento

Para inicializar los datos de Administrador y Catálogo Escolar dentro del contenedor del backend:
```bash
docker exec -it sisedgua_backend npm run seed
```

Credenciales creadas por defecto:
- **Usuario:** `admin@sisedgua.ve`
- **Contraseña:** `Admin2026!` *(Recomendado cambiar tras el primer ingreso)*
