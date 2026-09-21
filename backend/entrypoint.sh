#!/bin/sh
set -e

echo "================================================="
echo "   SISEDGUA - Inicio de Contenedor Backend"
echo "================================================="

echo "⏳ Esperando a que PostgreSQL esté listo en $DB_HOST:$DB_PORT..."
until nc -z -v -w30 "$DB_HOST" "$DB_PORT" > /dev/null 2>&1; do
  echo "Esperando conexión con la base de datos..."
  sleep 2
done

echo "✅ Base de datos PostgreSQL disponible."

# Ejecutar seeders automáticos para garantizar catálogo y usuario administrador
echo "🌱 Ejecutando seeders de datos iniciales (Instituciones y Admin)..."
node src/seeders/institucionSeeder.js || true
node src/seeders/adminSeeder.js || true

echo "🚀 Iniciando servidor API SISEDGUA..."
exec "$@"
