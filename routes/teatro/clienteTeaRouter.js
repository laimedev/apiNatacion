const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const  ClienteTea  = require('../../models/teatro/clienteTea'); // Asumiendo que tienes un modelo llamado 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const axios = require('axios');

const fs = require('fs');
const path = require('path');



// Ruta de registro
router.post('/register', [
    check('tipo_documento').notEmpty().withMessage('El número de documento es requerido'),
    check('num_documento').notEmpty().withMessage('El número de documento es requerido'),
    check('nombres').notEmpty().withMessage('El nombre es requerido'),
    check('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    check('passwordConfirmation').notEmpty().withMessage('La confirmación de contraseña es requerida').custom((value, { req }) => value === req.body.password).withMessage('La confirmación de contraseña no coincide'),
    check('email').notEmpty().withMessage('El correo electrónico es requerido').isEmail().withMessage('El correo electrónico no es válido'),
    check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
  
    try {
      const { 
              tipo_documento,
              num_documento,
              nombres,
              primer_apellido,
              segundo_apellido,
              sexo,
              fecha_nac, telefono, email, password,departamento,provincia,distrito
            } = req.body;
  
      // Verificar si el admin ya está registrado
     const existingAdmin = await ClienteTea.findOne( { email } );
     if (existingAdmin) {
  
  
       return res.status(400).json({ error: 'El usuario ya está registrado' });
     }
  
     const existingDni = await ClienteTea.findOneDni( { num_documento } );
     if (existingDni) {
       return res.status(400).json({ error: 'El usuario ya está registrado' });
     }
  
      // Crear una instancia del admin
      const adminData = {
        tipo_documento,
        num_documento,
        nombres,
        primer_apellido,
        segundo_apellido,
        sexo,
        fecha_nac, telefono, email, departamento,provincia,distrito,
        password: await bcrypt.hash(password, 10),
        estado: 'INACTIVO',
        tipo: 'CLIENTE',
        creacion: new Date().toISOString(),
        };
        const adminId = await ClienteTea.create(adminData);
        const admin = await ClienteTea.findOne({ email });
        const token = jwt.sign({ codCliente: admin.codCliente, nombres: admin.nombres, email: admin.email }, process.env.JWT_SEC); // Generar el token JWT
  
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
          }
        });
  
        const mailOptions = {
          from: process.env.EMAIL_USERNAME,
          to: email,
          subject: 'Activación de cuenta',
          html: `<!DOCTYPE html>
          <html>
          <head>
            <title>Activación de cuenta</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #000;
                margin: 0;
                padding: 0;
                text-align: center;
              }
  
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
  
              .card {
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin: 20px auto;
                text-align: center;
              }
  
              .header, .footer {
                background: linear-gradient(to right, #E2F4FC, #C2E7F8);
                color: #036476;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                font-size: 20px;
                font-weight: bold;
              }
  
              .footer {
                border-radius: 0 0 8px 8px;
                padding: 20px;
                text-align: center;
              }
  
              .code-card {
                background-color: #f9f9f9;
                border: 2px dashed #0044cc;
                padding: 20px;
                border-radius: 8px;
                font-size: 24px;
                margin: 20px auto;
                display: block;
                width: 80%; /* Ajusta este valor para cambiar el ancho */
              }
  
              h1 {
                font-size: 24px;
                margin: 0;
              }
  
              p {
                font-size: 16px;
                margin: 10px 0;
              }
  
              a {
                color: #0044cc;
                text-decoration: none;
              }
  
              img {
                max-width: 150px;
                height: auto;
                margin-top: 10px;
              }
  
              .activation-button {
                background: linear-gradient(to right, #009EE4, #009EE4);;
                color: #fff!important;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  ACTIVACIÓN DE CUENTA
                </div>
                <p style="padding-top: 7px;">Hola ${admin.nombres} ${admin.primer_apellido} ${admin.segundo_apellido},</p>
                <p>Bienvenido/a a ${process.env.COMPANY}. <br>  Haz clic en el siguiente botón para activar tu cuenta:</p>
                <div style="text-align: center; margin: 20px;">
                  <a href="${process.env.BACKEND}/api/teatro/client/activate-user?token=${token}" class="activation-button">
                    Activar cuenta
                  </a>
                </div>
                <p style="font-size: 10px; color: #62667F; padding: 7px;">Este enlace de activación es valido por 2 Horas.</p>
                <div class="footer">
                  <img src="${process.env.LOGO}" alt="Logo de la Empresa">
                </div>
              </div>
            </div>
          </body>
          </html>`,
        };
    
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            return res.status(200).json({ message: 'Error al enviar el correo', reps: false });
          }
          return res.status(200).json({ success: 'Registrado exitosamente & Correo enviado, revise su bandeja de entrada.',
            token: token,
            codCliente: admin.codCliente,
            nombre: admin.nombres,
          });
        });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error en el registro' });
    }
  });

  




  router.get('/activate-user', async (req, res) => {
    const { token, estado = 'ACTIVO' } = req.query; // Obtener los parámetros de la URL
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let codCliente;
    let nombres;
    let email;
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SEC);
      codCliente = decodedToken.codCliente;
      nombres = decodedToken.nombres;
      email = decodedToken.email;
    } catch (error) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    try {
      const userDataToUpdate = { estado };
      await ClienteTea.changeStatus(codCliente, userDataToUpdate);
      // return res.status(200).json({ success: 'Usuario activado correctamente' });
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Usuario Activado</title>
          <style>
          body{font-family:Arial,sans-serif;background-color:#f4f4f4;color:#000;margin:0;padding:0;text-align:center}
          .container{max-width:600px;margin:0 auto}
          .card{background-color:#fff;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,.1);margin:20px auto;display:flex;flex-direction:column}
          .header,.footer{background:linear-gradient(to right,#C2E7F8,#E2F4FC);color:#145C6E;padding:15px;font-size:20px;display:flex;justify-content:space-between;align-items:center}
          .header{border-radius:8px 8px 0 0}
          .footer{border-radius:0 0 8px 8px;text-align:center}
          .content{padding:20px}
          h1{font-size:16px;margin:0}
          p{font-size:14px;margin:10px 0}
          a{color:#0044cc;text-decoration:none}
          .logo-check{max-width:70px;height:auto;margin-top:10px}
          .close-button{background:red;color:#fff;padding:10px 20px;border:1px solid #fff;border-radius:5px;cursor:pointer;text-decoration:none;display:inline-block;font-size:16px}
          .company-logo{width:150px}
        </style>
  
          <script>
            function closeWindow() {
              window.close();
            }
          </script>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <span> <b>Activación exitosa!!</b> </span>
                <a href="#" class="close-button" onclick="closeWindow()"> X </a>
              </div>
              <div class="content">
                <h1>Hola ${nombres}, tu cuenta fue activada. </h1> <br>
                <p>Su correo electrónico es: <b> ${email} <b></p>
                <p>Puede iniciar sesión en la aplicación.</p>
                <img class="logo-check" src="https://cdn3.emoji.gg/emojis/1115_green_tick.gif" alt="Activado">
                <h1>Muchas gracias</h1>
              </div>
              <div class="footer" style="text-align: center; justify-cotent: center;">
                <img src="${process.env.LOGO}" alt="Logo de la Empresa" class="company-logo">
              </div>
            </div>
          </div>
        </body>
        </html>`);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
    }
  });
  









  router.post('/login', [
    check('num_documento').notEmpty().withMessage('El numero de documento es requerido'),
    check('password').notEmpty().withMessage('La contraseña es requerida'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    try {
      const { num_documento, password } = req.body;
  
      // Buscar al admin por correo electrónico
      const admin = await ClienteTea.findOne({ num_documento });
      if (!admin) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
  
      // Verificar el estado del admin
      if (admin.estado !== 'ACTIVO') {
        return res.status(401).json({ error: 'Usuario inactivo, porfavor revise la bandeja de entrada de su correo electronico' });
      }
  
  
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
      // Generar el token JWT
      const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SEC); // Aquí debes utilizar tu propia clave secreta
  
      // Iniciar sesión exitosamente y devolver el token
      return res.status(200).json({ 
        ok: true,
        token,
        codCliente: admin.codCliente,
        nombre: admin.nombres,
        num_documento: admin.num_documento,
        email: admin.email,
        tipo: admin.tipo
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error en el inicio de sesión' });
    }
  });






  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (email === '') {
      return res.status(400).json({
        error: "El email es requerido"
      });
    }
  
    try {
      const admin = await ClienteTea.findOne({ email });
      if (!admin) {
        return res.status(403).json({ error: 'El correo electronico ingresado, no existe en el sistema.' });
      }
      const token = jwt.sign({ codCliente: admin.codCliente }, process.env.JWT_SEC, { expiresIn: "1h" });
  
      await ClienteTea.updateToken(admin.codCliente, token);
  
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Recuperación de contraseña',
        html: `<!DOCTYPE html>
<html>
<head>
  <title>Recuperación de contraseña</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      color: #000;
      margin: 0;
      padding: 0;
      text-align: center;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .card {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin: 20px auto;
      text-align: center;
    }

    .header, .footer {
      background: linear-gradient(to right, #C3E7E0, #C3E7E0);
      color: #036476;
      padding: 15px;
      border-radius: 8px 8px 0 0;
      font-size: 20px;
      font-weight: bold;
    }

    .footer {
      border-radius: 0 0 8px 8px;
      padding: 20px;
      text-align: center;
    }

    h1 {
      font-size: 24px;
      margin: 0;
    }

    p {
      font-size: 16px;
      margin: 10px 0;
    }

    a {
      color: #0044cc;
      text-decoration: none;
    }

    img {
      max-width: 150px;
      height: auto;
      margin-top: 10px;
    }

    .reset-button {
      background: linear-gradient(to right, #036476, #036476);
      color: #fff!important;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        RECUPERACIÓN DE CONTRASEÑA
      </div>
      <p style="padding-top: 7px;">Hola ${admin.nombres} ${admin.primer_apellido} ${admin.segundo_apellido},</p>
      <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente botón para restablecerla:</p>
      <div style="text-align: center; margin: 20px;">
        <a href="${process.env.FRONTEND}/#/login/reset-password?token=${token}" class="reset-button">
          Restablecer contraseña
        </a>
      </div>
      <p style="font-size: 10px; color: #62667F; padding: 7px;">El enlace es válido por 1 hora.</p>
      <div class="footer">
        <img src="${process.env.LOGO}" alt="Logo de la Empresa">
      </div>
    </div>
  </div>
</body>
</html>
 
        `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ error: 'Error al enviar el correo' });
        }
        return res.status(200).json({ message: 'Recuperado existosamente!! Se envio un correo de recuperación, revise su bandeja de entrada porfavor.' });
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  



  router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
  
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SEC);
        const codCliente = decodedToken.codCliente;
  
        const passwordValidation = validatePassword(password);
        if (passwordValidation !== 'valid') {
            return res.status(400).json({ error: passwordValidation });
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
        await ClienteTea.updatePassword(codCliente, hashedPassword);
        res.status(200).json({ message: 'Contraseña reseteada exitosamente.', resp: true });
  
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return res.status(400).json({ error: 'El token ha expirado. Solicita nuevamente el restablecer la contraseña.' });
        }
        console.log(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  
  function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;
    
    if (!passwordRegex.test(password)) {
        return 'La contraseña debe tener al menos 8 caracteres, al menos una letra mayúscula, una letra minúscula, un número y un carácter especial como @$!%*?&#.';
    }  
    return 'valid';
  }



router.put('/edit/:codCliente', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
], async (req, res) => {
  const userId = req.params.codCliente;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const userDataToUpdate = req.body;
    await ClienteTea.updateUser(userId, userDataToUpdate);
    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});





router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const records = parseInt(req.query.records) || 10;
    const searchTerm = req.query.searchTerm || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    // Obtener usuarios con paginación y búsqueda utilizando la función getUsers del modelo
    const { users, total } = await ClienteTea.getUsers(page, records, searchTerm, status, startDate, endDate);

    return res.status(200).json({ data: users, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});






router.put('/edit/:codCliente', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
], async (req, res) => {
  const userId = req.params.codCliente;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const userDataToUpdate = req.body;
    await ClienteTea.updateUser(userId, userDataToUpdate);
    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});




// Ruta para obtener un usuario por su ID
router.get('/:codCliente', async (req, res) => {
  const codCliente = req.params.codCliente;
  try {
    const user = await ClienteTea.getUserById(codCliente);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});



router.put('/changeStatus/:codCliente', async (req, res) => {
  const userId = req.params.codCliente;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const userDataToUpdate = req.body;
    await ClienteTea.changeStatus(userId, userDataToUpdate);
    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});



router.delete('/delete/:codCliente', async (req, res) => {
  const userId = req.params.codCliente;
  try {
    await ClienteTea.deleteUserById(userId);

    return res.status(200).json({ success: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});




// Ruta para exportar todos los usuarios a un archivo de Excel
router.post('/export-excel', async (req, res) => {
  try {
    // Obtener todos los usuarios (suponiendo que tengas una función en el modelo para hacerlo)
    const users = await ClienteTea.getAllUsers();

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

  
      worksheet.getRow(1).font = { bold: true };

    // Agregar encabezados de columna
    worksheet.columns = [
      { header: 'ID', key: 'codUsuario', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 30 },
      { header: 'Nombre', key: 'nombres', width: 30 },
      { header: 'Primer apellido', key: 'primer_apellido', width: 30 },
      { header: 'Segundo apellido', key: 'segundo_apellido', width: 30 },
      { header: 'Documento', key: 'num_documento', width: 30 },
      { header: 'Telefono', key: 'telefono', width: 30 },
      { header: 'Correo electrónico', key: 'email', width: 30 },
      { header: 'Fecha registro', key: 'creacion', width: 30 },
      // Agrega más encabezados según tus necesidades
    ];

    // Establecer bordes alrededor de las celdas
    worksheet.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6495ED' }
        };
      });
    });
    
    // Agregar datos de los usuarios a las filas
    users.forEach((user, index) => {
      worksheet.addRow({
        codCliente: user.codCliente,
        tipo: user.tipo,
        nombres: user.nombres,
        primer_apellido: user.primer_apellido,
        segundo_apellido: user.segundo_apellido,
        num_documento: user.num_documento,
        telefono: user.telefono,
        email: user.email,
        creacion: user.creacion,
        // Agrega más datos según la estructura de tu modelo de usuario
      });
    });

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar el archivo Excel como respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los usuarios a Excel' });
  }
});



router.post('/search-reniec', async (req, res) => {
  const { dni } = req.body; // Extrae el DNI del cuerpo de la solicitud

  const token = 'apis-token-8875.RGy14s7YfZiMND7NqyFkV3aK322jE82x';
  const url = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Devuelve la respuesta de la API externa al frontend
    res.json(response.data);
  } catch (error) {
    console.error('Error al hacer la solicitud a la API de RENIEC:', error);
    res.status(500).json({ error: 'Error al obtener datos de RENIEC' });
  }
});






  module.exports = router;
