const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const admin = await Admin.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await admin.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, nombre: admin.nombre },
      process.env.JWT_SECRET || 'sisedgua_super_secret_jwt_key_2026',
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      nombre: admin.nombre,
      email: admin.email
    });
  } catch (error) {
    console.error('Error en login admin:', error);
    return res.status(500).json({ error: 'Error interno en autenticación' });
  }
};
