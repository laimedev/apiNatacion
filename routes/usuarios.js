const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const  Usuario  = require('../models/Usuario'); // Asumiendo que tienes un modelo llamado Admin
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const { TokenExpiredError } = require('jsonwebtoken');


const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: 'laimedev',
  api_key: '514357759962521',
  api_secret: '1KGNTYZhwe_7TMXNLwvNR6SCWwQ'
})


// Ruta de registro
router.post('/register', [
  check('numDocumento').notEmpty().withMessage('El número de documento es requerido'),
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  check('passwordConfirmation').notEmpty().withMessage('La confirmación de contraseña es requerida').custom((value, { req }) => value === req.body.password).withMessage('La confirmación de contraseña no coincide'),
  check('email').notEmpty().withMessage('El correo electrónico es requerido').isEmail().withMessage('El correo electrónico no es válido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
  check('tipo').notEmpty().withMessage('El tipo de cliente es requerido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


  try {
    const { 
            numDocumento,
            nombres,
            email,
            telefono,
            password,
            tipo
          } = req.body;

    // Verificar si el admin ya está registrado
   const existingAdmin = await Admin.findOne( { email } );
   if (existingAdmin) {


     return res.status(400).json({ error: 'El administrador ya está registrado' });
   }

   const existingDni = await Admin.findOneDni( { numDocumento } );
   if (existingDni) {
     return res.status(400).json({ error: 'El administrador ya está registrado' });
   }


    // Crear una instancia del admin
    const adminData = {
        numDocumento,
        nombres,
        email,
        telefono,
        password: await bcrypt.hash(password, 10),
        estado: 'INACTIVO',
        tipo: 'ADMINISTRADOR',
        creacion: new Date().toISOString(),
        tipo
      };
      const adminId = await Admin.create(adminData);
      const admin = await Admin.findOne({ email });
      const token = jwt.sign({ codUsuario: admin.codUsuario, nombres: admin.nombres, email: admin.email }, process.env.JWT_SEC); // Generar el token JWT

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
              background: linear-gradient(to right, #0044cc, #e6007e);
              color: #ffffff;
              padding: 15px;
              border-radius: 8px 8px 0 0;
              font-size: 20px;
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
              background: linear-gradient(to right, #0044cc, #e6007e);;
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
              <p>Hola ${admin.nombres},</p>
              <p>Bienvenido/a a ${process.env.COMPANY}. <br>  Haz clic en el siguiente botón para activar tu cuenta:</p>
              <div style="text-align: center; margin: 20px;">
                <a href="${process.env.BACKEND}/api/admin/activate-user?token=${token}" class="activation-button">
                  Activar cuenta
                </a>
              </div>
              <p>Si no solicitaste activar una cuenta, ignora este correo.</p>
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
          codAdmin: admin.codAdmin,
          nombre: admin.nombres,
          tipo:admin.tipo
        });
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el registro' });
  }
});







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

    // Buscar al admin por correo electrónico
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }


    // Verificar el estado del admin
    if (admin.estado !== 'ACTIVO') {
      return res.status(401).json({ error: 'Usuario inactivo, comuníquese con el administrador.' });
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
      codUsuario: admin.codUsuario,
      nombre: admin.nombres,
      tipo: admin.tipo,
      email: admin.email
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});




router.put('/edit/:codUsuario', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
  // check('password').optional().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  // check('passwordConfirmation').optional().custom((value, { req }) => {
  //   if (value !== req.body.password) {
  //     throw new Error('La confirmación de contraseña no coincide');
  //   }
  //   return true;
  // })
], async (req, res) => {
  const userId = req.params.codUsuario;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const userDataToUpdate = req.body;

    // Elimina el campo 'passwordConfirmation' antes de actualizar
    // delete userDataToUpdate.passwordConfirmation;

    // Si se proporciona una nueva contraseña, hasheala antes de actualizarla
    // if (userDataToUpdate.password) {
    //   userDataToUpdate.password = await bcrypt.hash(userDataToUpdate.password, 10);
    // }

    // Actualiza la información del usuario utilizando la función update del modelo
    await Admin.updateUser(userId, userDataToUpdate);

    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});


router.put('/edit/profile/:codUsuario', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
  check('password'),
  check('passwordConfirmation').optional().custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('La confirmación de contraseña no coincide');
    }
    return true;
  })
], async (req, res) => {
  const userId = req.params.codUsuario;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const userDataToUpdate = req.body;

    // Elimina el campo 'passwordConfirmation' antes de actualizar
    delete userDataToUpdate.passwordConfirmation;

    // Verifica si se proporciona una nueva contraseña
    if (userDataToUpdate.password) {
      // Si se proporciona una nueva contraseña, hasheala antes de actualizarla
      userDataToUpdate.password = await bcrypt.hash(userDataToUpdate.password, 10);
    } else {
      // Si no se proporciona una nueva contraseña, elimina 'password' de userDataToUpdate
      delete userDataToUpdate.password;
    }

    // Verifica si se proporciona una nueva imagen de perfil
    if (req.files && req.files.foto) {
      // Si se proporciona una nueva imagen, elimina la foto anterior de Cloudinary
      const user = await Admin.findOne2('codUsuario', userId); // Busca el usuario por su identificador
      if (user && user.foto) {
        await cloudinary.uploader.destroy(user.foto); // Elimina la foto anterior de Cloudinary
      }

      // Sube la nueva imagen a Cloudinary
      const imagen_path = req.files.foto.tempFilePath;
      const resp = await cloudinary.uploader.upload(imagen_path, { folder: "reservation/admin", public_id: `${Date.now()}`, width: 550 });
      const pathUrl = resp.secure_url;
      // const urlArray = pathUrl.split('/');
      // const lastTwoValues = urlArray[9];   
      // userDataToUpdate.foto = lastTwoValues;
      userDataToUpdate.foto = pathUrl;
    } else {
      // Si no se proporciona una nueva imagen, mantén la imagen actual del usuario
      const user = await Admin.findOne2('codUsuario', userId); // Busca el usuario por su identificador
      if (user) {
        userDataToUpdate.foto = user.foto; // Asigna la imagen actual del usuario a userDataToUpdate.avatar
      }
    }

    // Actualiza la información del usuario utilizando la función update del modelo
    await Admin.updateUser(userId, userDataToUpdate);

    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});




router.put('/changeStatus/:codUsuario', async (req, res) => {
  const userId = req.params.codUsuario;
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const userDataToUpdate = req.body;

    // Actualiza la información del usuario utilizando la función update del modelo
    await Admin.changeStatus(userId, userDataToUpdate);

    return res.status(200).json({ success: 'Información de usuario actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de usuario' });
  }
});




// const decodedToken = jwt.verify(tokenTest, process.env.JWT_SEC);
// const idUsuario = decodedToken.codUsuario;




router.get('/activate-user', async (req, res) => {
  const { token, estado = 'ACTIVO' } = req.query; // Obtener los parámetros de la URL
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let codUsuario;
  let nombres;
  let email;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SEC);
    codUsuario = decodedToken.codUsuario;
    nombres = decodedToken.nombres;
    email = decodedToken.email;
  } catch (error) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
  try {
    const userDataToUpdate = { estado };
    await Admin.changeStatus(codUsuario, userDataToUpdate);
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
        .header,.footer{background:linear-gradient(to right,#0044cc,#e6007e);color:#fff;padding:15px;font-size:20px;display:flex;justify-content:space-between;align-items:center}
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
              <span>ACTIVACIÓN</span>
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





router.delete('/delete/:codUsuario', async (req, res) => {
  const userId = req.params.codUsuario;

  try {
    // Eliminar el usuario por su ID utilizando la función deleteUserById del modelo
    await Admin.deleteUserById(userId);

    return res.status(200).json({ success: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar el usuario' });
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
    const { users, total } = await Admin.getUsers(page, records, searchTerm, status, startDate, endDate);

    return res.status(200).json({ data: users, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});



// Ruta para obtener un usuario por su ID
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Obtener el usuario por su ID utilizando la función getUserById del modelo
    const user = await Admin.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});



// Ruta para exportar todos los usuarios a un archivo de Excel
router.post('/export-excel', async (req, res) => {
  try {
    // Obtener todos los usuarios (suponiendo que tengas una función en el modelo para hacerlo)
    const users = await Admin.getAllUsers();

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

  
      worksheet.getRow(1).font = { bold: true };

    // Agregar encabezados de columna
    worksheet.columns = [
      { header: 'ID', key: 'codUsuario', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 30 },
      { header: 'Nombre', key: 'nombres', width: 30 },
      { header: 'Documento', key: 'numDocumento', width: 30 },
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
        codUsuario: user.codUsuario,
        tipo: user.tipo,
        nombres: user.nombres,
        numDocumento: user.numDocumento,
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


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (email === '') {
    return res.status(400).json({
      error: "El email es requerido"
    });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(403).json({ error: 'No existe el email' });
    }
    const token = jwt.sign({ usuarioId: admin.codUsuario }, process.env.JWT_SEC, { expiresIn: "1h" });

    await Admin.updateToken(admin.codUsuario, token);

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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recuperación de contraseña</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #fff;
              color: #000;
              margin: 0;
              padding: 0;
            }
            
            .container {
              text-align: center;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            
            h1 {
              font-size: 24px;
              color: #006F57;
            }
            
            p {
              font-size: 16px;
              margin-bottom: 10px;
            }
            
            a {
              color: #BCCD1E;
              text-decoration: none;
            }
            
            img {
              max-width: 100%;
              height: auto;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>¡Gracias por solicitar recuperar contraseña en ${process.env.COMPANY}!</h1>
            <p>Hola ${admin.nombres},</p>
            <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
            <a href="${process.env.FRONTEND}/#/login/reset-password?token=${token}">Restablecer contraseña</a>
            <p>El enlace es válido por 1 hora.</p>
            <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
            <p>Saludos,</p>
            <p>El equipo de de Reservas el chato</p>
            <img src="https://img.freepik.com/vector-gratis/plantilla-logotipo-futbol-diseno-plano-dibujado-mano_23-2149373252.jpg" alt="Descripción de la imagen">
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
      return res.status(200).json({ message: 'Correo enviado' });
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});



router.post('/forgot-password-four-digits', async (req, res) => {
  const { email } = req.body;
  if (email === '') {
    return res.status(400).json({
      error: "El email es requerido"
    });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(403).json({ error: 'No existe el email' });
    }

    // Generar un código de 4 dígitos aleatorios
    const code = Math.floor(1000 + Math.random() * 9000);
    const token = jwt.sign({ usuarioId: admin.codUsuario }, process.env.JWT_SEC, { expiresIn: "1h" });


    // Guardar el código y la caducidad en la base de datos
    await Admin.updateTokenAndCode(admin.codUsuario, token, code);

    // await Admin.updateToken(admin.codUsuario, token);


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
      html: `
        <!DOCTYPE html>
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
      background: linear-gradient(to right, #0044cc, #e6007e);
      color: #ffffff;
      padding: 15px;
      border-radius: 8px 8px 0 0;
      font-size: 20px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        RECUPERACIÓN DE CONTRASEÑA <br> ${process.env.COMPANY}
      </div>
      <p>Hola ${admin.nombres},</p>
      <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para restablecerla:</p>
      <div class="code-card">
        ${code}
      </div>
      <p>El código es válido por 1 hora.</p>
      <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
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
        return res.status(200).json({ message: 'Error al enviar el correo', reps: false });
      }
      return res.status(200).json({ message: 'Correo enviado, revise su bandeja de entrada.',  resp: true, code , token});
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
      const usuarioId = decodedToken.usuarioId;

      const passwordValidation = validatePassword(password);
      if (passwordValidation !== 'valid') {
          return res.status(400).json({ error: passwordValidation });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.updatePassword(usuarioId, hashedPassword);
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




router.post('/validate-token-and-code', async (req, res) => {
  const { token, verifyCode } = req.body;

  console.log('comprueebaaaaaaaaa capiii');
  console.log(token);
  console.log(verifyCode);

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SEC);
    const usuarioId = decodedToken.usuarioId;

    // Realizar la consulta en la base de datos usando el usuarioId
    const usuario = await Admin.findOne({ codUsuario: usuarioId });

    if (!usuario) {
      return res.status(400).json({ error: 'Usuario no encontrado.', resp: false });
    }


    // Verificar si el verifyCode coincide con el valor en la base de datos
    if (String(usuario.verify_code) !== String(verifyCode)) {
      return res.status(400).json({ error: 'Código de verificación incorrecto.',  resp: false });
    }

    res.status(200).json({ message: 'El token y el código de verificación son válidos.', usuarioId: usuario.codUsuario, resp: true });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(400).json({ error: 'El token ha expirado. Solicita nuevamente el restablecer la contraseña.', resp: false });
    }
    console.log(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;



