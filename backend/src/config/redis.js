const Redis = require('ioredis');
require('dotenv').config();

let isConnected = false;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  enableOfflineQueue: true, // Permite que rate-limit-redis encole SCRIPT LOAD durante el arranque sin fallar
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  retryStrategy(times) {
    if (times > 8) {
      console.warn('⚠️ [Redis] Límite de reintentos alcanzado. Operando en modo degradado (Fallback directo a PostgreSQL).');
      return null;
    }
    return Math.min(times * 500, 2000);
  }
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  isConnected = true;
  console.log('⚡ [Redis] Conexión establecida con éxito con Redis 7');
});

redisClient.on('ready', () => {
  isConnected = true;
});

redisClient.on('error', (err) => {
  isConnected = false;
  // Advertencia controlada sin crashear el servidor Node
  console.warn('⚠️ [Redis] Error de conexión (Fallback a Postgres activo):', err.message);
});

redisClient.on('close', () => {
  isConnected = false;
});

/**
 * Helper para verificar si Redis está activo
 */
const isRedisAvailable = () => isConnected && redisClient.status === 'ready';

/**
 * Obtener y deserializar JSON de caché
 * Si Redis no está disponible o falla, retorna null (provoca Cache Miss transparente)
 */
async function getJson(key) {
  if (!isRedisAvailable()) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[Redis getJson] Error al leer clave ${key}:`, error.message);
    return null;
  }
}

/**
 * Guardar objeto en caché con TTL en segundos
 */
async function setJson(key, value, ttlSeconds = 60) {
  if (!isRedisAvailable()) return false;
  try {
    const raw = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, raw, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, raw);
    }
    return true;
  } catch (error) {
    console.warn(`[Redis setJson] Error al escribir clave ${key}:`, error.message);
    return false;
  }
}

/**
 * Eliminar una o varias claves específicas
 */
async function delKeys(...keys) {
  if (!isRedisAvailable() || keys.length === 0) return 0;
  try {
    return await redisClient.del(...keys);
  } catch (error) {
    console.warn('[Redis delKeys] Error al eliminar claves:', error.message);
    return 0;
  }
}

/**
 * Eliminar claves por patrón usando SCAN (no bloquea el hilo principal de Redis como KEYS)
 */
async function delByPattern(pattern) {
  if (!isRedisAvailable()) return 0;
  try {
    return new Promise((resolve) => {
      const stream = redisClient.scanStream({
        match: pattern,
        count: 100
      });

      let totalDeleted = 0;

      stream.on('data', async (keys = []) => {
        if (keys.length > 0) {
          stream.pause();
          try {
            await redisClient.del(...keys);
            totalDeleted += keys.length;
          } catch (e) {
            console.warn('[Redis delByPattern] Error en batch delete:', e.message);
          } finally {
            stream.resume();
          }
        }
      });

      stream.on('end', () => resolve(totalDeleted));
      stream.on('error', (err) => {
        console.warn('[Redis delByPattern] Error en scanStream:', err.message);
        resolve(totalDeleted);
      });
    });
  } catch (error) {
    console.warn(`[Redis delByPattern] Error al procesar patrón ${pattern}:`, error.message);
    return 0;
  }
}

module.exports = {
  redisClient,
  isRedisAvailable,
  getJson,
  setJson,
  delKeys,
  delByPattern
};
