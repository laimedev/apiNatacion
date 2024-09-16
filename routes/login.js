const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const Cliente = require('../models/Clientes'); // Asumiendo que tienes un modelo llamado Cliente

// Ruta de inicio de sesión
router.post('/login', [
  check('email').notEmpty().withMessage('El correo electrónico es requerido').isEmail().withMessage('El correo electrónico no es válido'),
  check('password').notEmpty().withMessage('La contraseña es requerida'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Buscar al cliente por correo electrónico
    const cliente = await Cliente.findOne({ email });
    if (!cliente) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, cliente.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Iniciar sesión exitosamente
    req.session.clienteId = cliente.id;
    return res.status(200).json({ success: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

// Ruta de cierre de sesión
router.post('/logout', (req, res) => {
  req.session.destroy();
  return res.status(200).json({ success: 'Cierre de sesión exitoso' });
});

module.exports = router;
