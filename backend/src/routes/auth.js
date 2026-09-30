const router = require('express').Router();
const ctrl = require('../controllers/authController');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticación de usuario
 *     description: |
 *       Autentica un usuario administrativo y devuelve un token JWT válido por 8 horas.
 *       
 *       **Nota de Seguridad**: Implementa rate limiting de 15 intentos cada 15 minutos por IP.
 *       Después de 3 intentos fallidos consecutivos, la cuenta se bloquea temporalmente.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@sisedgua.ve"
 *                 description: Email del administrador registrado
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "okmLIqlAFOWzIg@2026!"
 *                 description: Contraseña del administrador
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: Token JWT de 8 horas de duración
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "admin@sisedgua.ve"
 *                     nombre:
 *                       type: string
 *                       example: "Administrador Sala Situacional"
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email o contraseña inválidos"
 *       429:
 *         description: Demasiados intentos de login (rate limit)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Demasiados intentos de acceso fallidos. Por seguridad, intente de nuevo en 15 minutos."
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', ctrl.login);

module.exports = router;
