/**
 * Middleware de Prevención y Detección de SQL Injection y Payloads Maliciosos
 * Sanitiza recursivamente strings y bloquea firmas reales de inyección SQL sin falsos positivos en español.
 */

// Firmas avanzadas de inyección SQL (case-insensitive, contextualizadas)
const SQL_INJECTION_PATTERNS = [
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\bSELECT\b[\s\S]{1,100}\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+[a-zA-Z0-9_]+\s+SET\b/i,
  /\bDROP\s+(TABLE|DATABASE|VIEW|INDEX|PROCEDURE)\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
  /\bEXEC(\s+|\()|xp_cmdshell/i,
  /(\bOR\b|\bAND\b)\s+['"]?(\d+|true|false)['"]?\s*=\s*['"]?(\d+|true|false)['"]?/i,
  /['"]\s*OR\s*['"]1['"]\s*=\s*['"]1/i,
  /;\s*(DROP|SELECT|INSERT|DELETE|UPDATE|TRUNCATE|ALTER)\b/i,
  /--[\s\r\n]+|;\s*--/i,
  /\/\*[\s\S]*?\*\//,
  /\bpg_sleep\s*\(/i,
  /\bbenchmark\s*\(/i,
  /\bwaitfor\s+delay\b/i,
  /\b(load_file|into\s+outfile|into\s+dumpfile)\b/i
];

/**
 * Limpia y desinfecta recursivamente cualquier cadena de texto
 */
function sanitizarValor(valor) {
  if (typeof valor === 'string') {
    // Si contiene firmas de SQL Injection peligrosas, se bloquea la petición
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(valor)) {
        const error = new Error('Se detectó un patrón o sintaxis SQL sospechosa en la solicitud.');
        error.status = 400;
        throw error;
      }
    }
    // Eliminar caracteres nulos que puedan evadir filtros de cadenas
    return valor.replace(/\0/g, '').trim();
  } else if (Array.isArray(valor)) {
    return valor.map(sanitizarValor);
  } else if (typeof valor === 'object' && valor !== null) {
    const sanitizado = {};
    for (const [k, v] of Object.entries(valor)) {
      // Bloquear claves con caracteres maliciosos de inyección NoSQL o SQL
      if (k.startsWith('$') || k.includes(';') || k.includes('--') || k.includes('/*')) {
        const error = new Error('Nombre de parámetro no permitido por directivas de seguridad.');
        error.status = 400;
        throw error;
      }
      sanitizado[k] = sanitizarValor(v);
    }
    return sanitizado;
  }
  return valor;
}

module.exports = function sqlInjectionGuard(req, res, next) {
  try {
    if (req.body) {
      req.body = sanitizarValor(req.body);
    }
    if (req.query) {
      req.query = sanitizarValor(req.query);
    }
    if (req.params) {
      req.params = sanitizarValor(req.params);
    }
    next();
  } catch (err) {
    return res.status(400).json({
      error: 'Solicitud rechazada por directivas de seguridad: ' + err.message
    });
  }
};
