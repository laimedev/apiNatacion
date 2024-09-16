/*const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
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

    // Generar el token JWT
    const token = jwt.sign({ clienteId: cliente.id }, process.env.JWT_SEC); // Aquí debes utilizar tu propia clave secreta

    // Iniciar sesión exitosamente y devolver el token
    return res.status(200).json({ 
      token:token,
      codCliente:cliente.codCliente,
      nombre:cliente.nombres,
      tipo:cliente.tipo
     });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

// Ruta de cierre de sesión (no es necesario con JWT, ya que los tokens son autónomos)
// Puedes agregar una lógica adicional si lo deseas, como invalidar el token en el servidor

module.exports = router;
*/


const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Cliente = require('../models/Clientes'); // Asumiendo que tienes un modelo llamado Cliente

// Ruta de inicio de sesión
// En tu router
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

    // Verificar si la respuesta contiene un error (cliente inactivo)
    if (cliente.error) {
      return res.status(403).json({ error: cliente.error });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, cliente.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign({ clienteId: cliente.id }, process.env.JWT_SEC); // Aquí debes utilizar tu propia clave secreta

    // Iniciar sesión exitosamente y devolver el token
    return res.status(200).json({ 
      token,
      codCliente: cliente.codCliente,
      nombre: cliente.nombres,
      tipo: cliente.tipo,
      email: cliente.email
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});
// Ruta de cierre de sesión (no es necesario con JWT, ya que los tokens son autónomos)
// Puedes agregar una lógica adicional si lo deseas, como invalidar el token en el servidor

module.exports = router;
