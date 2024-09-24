const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuarios = require('../models/Usuarios');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: 'laimedev',
  api_key: '514357759962521',
  api_secret: '1KGNTYZhwe_7TMXNLwvNR6SCWwQ'
});

// Registrar un nuevo usuario
router.post('/register', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('primer_apellido').notEmpty().withMessage('El primer apellido es requerido'),
  check('tipoDocumento').notEmpty().withMessage('El tipo de documento es requerido'),
  check('numDocumento').notEmpty().withMessage('El número de documento es requerido'),
  check('email').isEmail().withMessage('Correo electrónico inválido'),
  check('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  check('passwordConfirmation')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('La confirmación de contraseña no coincide'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { nombres, primer_apellido, segundo_apellido,  tipoDocumento, numDocumento, tipo, telefono, email, password, foto } = req.body;

    // Verificar si el email ya está registrado
    const existingUser = await Usuarios.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Verificar si el número de documento ya está registrado
    const existingDocumento = await Usuarios.findOne({ numDocumento });
    if (existingDocumento) {
      return res.status(400).json({ error: 'El número de documento ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const formData = {
      nombres,
      primer_apellido,
      segundo_apellido,
      tipoDocumento,
      numDocumento,
      telefono,
      tipo,
      email,
      password: hashedPassword,
      foto: foto || null,
      estado: 'INACTIVO',
      creacion: new Date().toISOString()
    };

    await Usuarios.create(formData);
    const user = await Usuarios.findOne({ email });

    // Generar token para verificación
    const token = jwt.sign({ codUsuario: user.codUsuario, nombres: user.nombres, email }, process.env.JWT_SEC, { expiresIn: '24h' });

    // Enviar correo de verificación
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const templatePath = path.join(__dirname, '..', 'views', 'activation-user.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Verificación de cuenta',
      html: htmlTemplate.replace(/\$\{user\.nombres\}/g, user.nombres)
                        .replace(/\$\{user\.primer_apellido\}/g, user.primer_apellido)
                        .replace(/\$\{user\.segundo_apellido\}/g, user.segundo_apellido)
                        .replace(/\$\{token\}/g, token)
                        .replace(/\$\{process\.env\.BACKEND\}/g, `${process.env.BACKEND}`)
                        .replace(/\$\{process\.env\.COMPANY\}/g, `${process.env.COMPANY}`)
                        .replace(/\$\{process\.env\.LOGO\}/g, `${process.env.LOGO}`)
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
      }
      return res.status(201).json({ success: 'Usuario registrado. Verifica tu correo para activar la cuenta.' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Activar cuenta de usuario
router.get('/activate-user', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const { codUsuario, nombres, email } = decoded;

    // Leer la plantilla HTML para la activación
    const templatePath = path.join(__dirname, '..', 'views', 'update-status-user.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    htmlTemplate = htmlTemplate.replace(/\$\{nombres\}/g, nombres)
                               .replace(/\$\{email\}/g, email)
                               .replace(/\$\{process\.env\.LOGO\}/g, `${process.env.LOGO}`);

    // Actualizar el estado del usuario a ACTIVO
    await Usuarios.updateUser(codUsuario, { estado: 'ACTIVO' });

    return res.status(200).send(htmlTemplate);
  } catch (error) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
});

// Listar usuarios con paginación, búsqueda, estado y filtro de fechas
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { users, total } = await Usuarios.getUsers(page, limit, search, status, startDate, endDate);

    res.status(200).json({ data: users, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});

// Obtener un usuario por ID
router.get('/:codUsuario', async (req, res) => {
  try {
    const user = await Usuarios.findOne({ codUsuario: req.params.codUsuario });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Eliminar un usuario
router.delete('/delete/:codUsuario', async (req, res) => {
  try {
    await Usuarios.deleteById(req.params.codUsuario);
    res.json({ success: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Exportar usuarios a Excel
router.post('/export-excel', async (req, res) => {
  try {
    const data = await Usuarios.exportData();

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    // Establecer encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [
      { header: 'ID', key: 'codUsuario', width: 10 },
      { header: 'Nombres', key: 'nombres', width: 30 },
      { header: 'Primer Apellido', key: 'primer_apellido', width: 30 },
      { header: 'Segundo Apellido', key: 'segundo_apellido', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Correo Electrónico', key: 'email', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Creación', key: 'creacion', width: 20 }
    ];

    // Añadir bordes y colores a las celdas
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6495ED' }
        };
      });
    });

    // Añadir datos de los usuarios a las filas
    data.forEach((user) => {
      worksheet.addRow({
        codUsuario: user.codUsuario,
        nombres: user.nombres,
        primer_apellido: user.primer_apellido,
        segundo_apellido: user.segundo_apellido,
        telefono: user.telefono,
        email: user.email,
        tipo: user.tipo,
        estado: user.estado,
        creacion: user.creacion
      });
    });

    // Generar el archivo Excel y enviarlo
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los usuarios a Excel' });
  }
});

// Cambiar el estado del usuario
router.put('/changeStatus/:codUsuario', async (req, res) => {
  const codUsuario = req.params.codUsuario;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const userDataToUpdate = req.body;
    await Usuarios.changeStatus(codUsuario, userDataToUpdate);
    return res.status(200).json({ success: 'Estado del usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al cambiar el estado del usuario' });
  }
});

// Editar la información del usuario
router.post('/edit/:codUsuario', [
  check('passwordConfirmation')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('La confirmación de la contraseña no coincide'),
], async (req, res) => {
  try {
    const codUsuario = req.params.codUsuario;
    const { nombres, primer_apellido, segundo_apellido, tipo, tipoDocumento, numDocumento, telefono, email, password } = req.body;

    // Obtener el usuario actual
    const currentUser = await Usuarios.findById(codUsuario);
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Crear un objeto formData con los campos a actualizar
    let formData = {
      nombres,
      primer_apellido,
      segundo_apellido,
      tipoDocumento,
      numDocumento,
      telefono,
      email,
      tipo
    };

    // Si se ha proporcionado una nueva contraseña, cifrarla
    if (password) {
      formData.password = await bcrypt.hash(password, 10);
    } else {
      formData.password = currentUser.password;  // Mantener la contraseña anterior
    }

    // Manejo de la foto (archivo) usando Cloudinary
    if (req.files && req.files.foto) {
      const fotoPath = req.files.foto.tempFilePath;
      const cloudinaryResponse = await cloudinary.uploader.upload(fotoPath, {
        folder: "users/profile",
        public_id: `${Date.now()}`
      });
      formData.foto = cloudinaryResponse.secure_url;
    } else {
      formData.foto = currentUser.foto;  // Mantener la foto anterior si no se actualiza
    }

    // Actualizar el usuario en la base de datos
    await Usuarios.updateUser(codUsuario, formData);
    return res.status(200).json({ success: 'Información del usuario actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en la actualización:', error);
    return res.status(500).json({ error: 'Error en la actualización' });
  }
});



// Ruta para iniciar sesión con email o numDocumento
router.post('/login', [
  check('identifier').notEmpty().withMessage('El email o número de documento es requerido'),
  check('password').notEmpty().withMessage('La contraseña es requerida'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { identifier, password } = req.body; // El identifier puede ser email o numDocumento
    
    // Buscar al cliente por email o numDocumento
    const usuario = await Usuarios.findOneByEmailOrDocumento(identifier);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si el estado es ACTIVO
    if (usuario.estado !== 'ACTIVO') {
      return res.status(401).json({ error: 'Usuario inactivo, por favor revise la bandeja de entrada de su correo electrónico' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign({ codUsuario: usuario.codUsuario, usuario: usuario.nombres, email: usuario.email }, process.env.JWT_SEC);

    // Iniciar sesión exitosamente y devolver el token
    return res.status(200).json({ 
      ok: true,
      token,
      codUsuario: usuario.codUsuario,
      nombre: usuario.nombres + ' ' + usuario.primer_apellido + ' ' + usuario.segundo_apellido,
      numDocumento: usuario.numDocumento,
      email: usuario.email,
      tipo: usuario.tipo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

module.exports = router;

