const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Clientes = require('../models/Clientes');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');


const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: 'laimedev',
  api_key: '514357759962521',
  api_secret: '1KGNTYZhwe_7TMXNLwvNR6SCWwQ'
})




// Registrar un nuevo cliente
router.post('/register', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('primer_apellido').notEmpty().withMessage('El primer apellido es requerido'),
  check('genero').notEmpty().withMessage('El género es requerido'),
  check('tipoDocumento').notEmpty().withMessage('El tipo de documento es requerido'),
  check('numDocumento').notEmpty().withMessage('El número de documento es requerido'),
  check('email').isEmail().withMessage('Correo electrónico inválido'),
  check('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  check('passwordConfirmation')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('La confirmación de contraseña no coincide'),
  check('direccion').notEmpty().withMessage('La dirección es requerida'),
  check('telefono').notEmpty().withMessage('El teléfono es requerido')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  try {
    const { nombres, primer_apellido, segundo_apellido, genero, tipoDocumento, numDocumento, direccion, telefono, email, password, passwordConfirmation, foto } = req.body;
    // Verificar si el email ya está registrado
    const existingClient = await Clientes.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    // Verificar si el número de documento ya está registrado
    const existingDocumento = await Clientes.findOne({ numDocumento });
    if (existingDocumento) {
      return res.status(400).json({ error: 'El número de documento ya está registrado' });
    }
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const formData = {
      nombres,
      primer_apellido,
      segundo_apellido,
      genero,
      tipoDocumento,
      numDocumento,
      direccion,
      telefono,
      email,
      password: hashedPassword,
      foto: foto || null,  // Si no se proporciona una foto, se deja como null
      estado: 'INACTIVO',
      creacion: new Date().toISOString()
    };
    await Clientes.create(formData);
    const client = await Clientes.findOne({ email });
    // Generar token para verificación
    const token = jwt.sign({ codCliente: client.codCliente, nombres: client.nombres, email }, process.env.JWT_SEC, { expiresIn: '24h' });
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
    const templatePath = path.join(__dirname, '..', 'views', 'activation-client.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Verificación de cuenta',
      html: htmlTemplate.replace(/\$\{client\.nombres\}/g, client.nombres)
      .replace(/\$\{client\.primer_apellido\}/g, client.primer_apellido)
      .replace(/\$\{client\.segundo_apellido\}/g, client.segundo_apellido)
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
      return res.status(201).json({ success: 'Cliente registrado. Verifica tu correo para activar la cuenta.' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al registrar cliente' });
  }
});


// Activar cuenta de cliente
router.get('/activate-user', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const { codCliente, nombres, email } = decoded;
     // Leer la plantilla HTML
     const templatePath = path.join(__dirname, '..', 'views', 'update-status-client.html');
     let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
     htmlTemplate = htmlTemplate.replace(/\$\{nombres\}/g, nombres)
     .replace(/\$\{email\}/g, email)
     .replace(/\$\{process\.env\.LOGO\}/g, `${process.env.LOGO}`);
    // Actualizar estado a ACTIVO
    await Clientes.updateUser(codCliente, { estado: 'ACTIVO' });
    return res.status(200).send(htmlTemplate);
  } catch (error) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
});


// Ruta para listar clientes con paginación, búsqueda, estado y filtro de fechas
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { clients, total } = await Clientes.getClients(page, limit, search, status, startDate, endDate);

    res.status(200).json({ data: clients, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de clientes' });
  }
});



// Obtener un cliente por ID
router.get('/:codCliente', async (req, res) => {
  try {
    const client = await Clientes.findOne({ codCliente: req.params.codCliente });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// Eliminar un cliente
router.delete('/delete/:codCliente', async (req, res) => {
  try {
    await Clientes.deleteById(req.params.codCliente);
    res.json({ success: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});



router.post('/export-excel', async (req, res) => {
  try {
    // Obtener los datos de los clientes excepto password, remember_token y foto
    const data = await Clientes.exportData();

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    // Establecer encabezados
    worksheet.getRow(1).font = { bold: true };

    worksheet.columns = [
      { header: 'ID', key: 'codCliente', width: 10 },
      { header: 'Nombres', key: 'nombres', width: 30 },
      { header: 'Primer Apellido', key: 'primer_apellido', width: 30 },
      { header: 'Segundo Apellido', key: 'segundo_apellido', width: 30 },
      { header: 'Género', key: 'genero', width: 15 },
      { header: 'Tipo Documento', key: 'tipoDocumento', width: 20 },
      { header: 'Número Documento', key: 'numDocumento', width: 20 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Correo Electrónico', key: 'email', width: 30 },
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

    // Agregar los datos de los clientes a las filas
    data.forEach((client) => {
      worksheet.addRow({
        codCliente: client.codCliente,
        nombres: client.nombres,
        primer_apellido: client.primer_apellido,
        segundo_apellido: client.segundo_apellido,
        genero: client.genero,
        tipoDocumento: client.tipoDocumento,
        numDocumento: client.numDocumento,
        direccion: client.direccion,
        telefono: client.telefono,
        email: client.email,
        estado: client.estado,
        creacion: client.creacion
      });
    });

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar el archivo Excel como respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los clientes a Excel' });
  }
});



// Ruta para CAMBIAR DE ESTADO del cliente
router.put('/changeStatus/:codCliente', async (req, res) => {
  const userId = req.params.codCliente;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const userDataToUpdate = req.body;
    await Clientes.changeStatus(userId, userDataToUpdate);
    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});





// Ruta para actualizar la información del cliente
router.post('/edit/:codCliente', [
  check('passwordConfirmation')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('La confirmación de la contraseña no coincide'),
], async (req, res) => {
  try {
    const codCliente = req.params.codCliente;
    const { nombres, primer_apellido, segundo_apellido, genero, tipoDocumento, numDocumento, direccion, telefono, email, password, passwordConfirmation } = req.body;

    // Obtener el registro actual del cliente
    const currentClient = await Clientes.findById(codCliente);
    if (!currentClient) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // Validación de errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // Crear un objeto formData con los campos que se van a actualizar
    let formData = {
      nombres,
      primer_apellido,
      segundo_apellido,
      genero,
      tipoDocumento,
      numDocumento,
      direccion,
      telefono,
      email
    };

    // Si se ha proporcionado una nueva contraseña, cifrarla
    if (password) {
      formData.password = await bcrypt.hash(password, 10);
    } else {
      formData.password = currentClient.password;  // Mantener la contraseña anterior
    }

    // Manejo de la foto (archivo) usando Cloudinary
    if (req.files && req.files.foto) {
      const fotoPath = req.files.foto.tempFilePath;
      const cloudinaryResponse = await cloudinary.uploader.upload(fotoPath, {
        folder: "clients/profile",
        public_id: `${Date.now()}`
      });
      formData.foto = cloudinaryResponse.secure_url;
    } else {
      formData.foto = currentClient.foto;  // Mantener la foto anterior si no se actualiza
    }

    // Eliminar campos vacíos o nulos del objeto formData
    Object.keys(formData).forEach(key => {
      if (formData[key] === "" || formData[key] === null || formData[key] === undefined) {
        delete formData[key];
      }
    });

    // Actualizar el cliente en la base de datos
    await Clientes.update(codCliente, formData);
    return res.status(200).json({ success: 'Información del cliente actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en la actualización:', error);
    return res.status(500).json({ error: 'Error en la actualización' });
  }
});




module.exports = router;