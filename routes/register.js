const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const  Cliente  = require('../models/Clientes'); // Asumiendo que tienes un modelo llamado Cliente
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
// Ruta de registro
router.post('/', [
  check('numDocumento').notEmpty().withMessage('El número de documento es requerido'),
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('email').notEmpty().withMessage('El correo electrónico es requerido').isEmail().withMessage('El correo electrónico no es válido'),
  check('telefono').notEmpty().withMessage('El número de teléfono es requerido'),
  check('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  check('passwordConfirmation').notEmpty().withMessage('La confirmación de contraseña es requerida').custom((value, { req }) => value === req.body.password).withMessage('La confirmación de contraseña no coincide'),
  check('tipo_documento').notEmpty().withMessage('El tipo de documento es requerido'),
  check('primer_apellido').notEmpty().withMessage('El primer apellido es requerido'),
  check('segundo_apellido').notEmpty().withMessage('El segundo apellido es requerido'),
  //check('nivel').notEmpty().withMessage('El nivel es requerido'),
  //check('posicion').notEmpty().withMessage('El nivel es requerido'),
  check('genero').notEmpty().withMessage('El nivel es requerido'),
  check('fechNac').notEmpty().withMessage('El fecha de nacimiento es requerido'),
  check('tipo').notEmpty().withMessage('El tipo de cliente es requerido'),

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
            tipo_documento,
            primer_apellido,
            segundo_apellido,
            //nivel,
            //posicion,
            genero,
            fechNac,
            tipo
          } = req.body;

    // Verificar si el cliente ya está registrado
   const existingCliente = await Cliente.findOne( { email } );
   if (existingCliente) {
     return res.status(400).json({ error: 'El cliente ya está registrado' });
   }

   const existingDni = await Cliente.findOneDni( { numDocumento } );
   if (existingDni) {
     return res.status(400).json({ error: 'El cliente ya está registrado' });
   }


    // Crear una instancia del cliente
    const clienteData = {
        numDocumento,
        nombres,
        email,
        telefono,
        password: await bcrypt.hash(password, 10),
        estado: 'ACTIVO',
        tipo: 'CLIENTE',
        creacion: new Date().toISOString(),
        tipo_documento,
        primer_apellido,
        segundo_apellido,
        //nivel,
        //posicion,
        genero,
        fechNac,
        tipo
      };
      const clienteId = await Cliente.create(clienteData);
      const cliente = await Cliente.findOne({ email });
      const token = jwt.sign({ clienteId: cliente.id }, process.env.JWT_SEC); // Generar el token JWT
      // Envío del correo electrónico
    var transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
    });
    var mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email, // Utilizamos el correo del usuario registrado como destinatario
      subject: 'Registro exitoso',
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Correo de bienvenida</title>
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
          <h1>¡Gracias por registrarte en Surco Tenis!</h1>
          <p>Bienvenido/a ${nombres}!</p>
          <p>Tu cuenta ha sido registrada exitosamente.</p>
          <p>Para comenzar a utilizar nuestros servicios, por favor verifica tu cuenta siguiendo las instrucciones a continuación:</p>
          <p>Ingresa a nuestro sitio web <a href="https://reservas.surcotenis.pe/">reservas.surcotenis.pe</a></p>
          <p>Utiliza las siguientes credenciales para iniciar sesión:</p>
          <p>Correo electrónico: ${email}</p>
          <p>Contraseña: ${password}</p>
          <p>Gracias nuevamente por unirte a nosotros. ¡Esperamos que disfrutes de tu experiencia en nuestro sitio web!</p>
          <p>Saludos,</p>
          <p>El equipo de Surco Tenis</p>
          <img src="https://surcotenis.pe/wp-content/uploads/2023/05/logo-300x140.png" alt="Descripción de la imagen">
        </div>
      </body>
      </html>      
  `,
    };


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error en el envío del correo electrónico' });
      } else {
        return res.status(200).json({ success: 'Registrado exitosamente. Se ha enviado un correo electrónico de confirmación.',
        token: token,
        codCliente: cliente.codCliente,
        nombre: cliente.nombres,
        tipo:cliente.tipo
      });
      }
    });
    //return res.status(200).json({ success: 'Registrado exitosamente. Se ha enviado un correo electrónico de confirmación.',
    //    token: token,
    //    codCliente: cliente.codCliente,
    //    nombre: cliente.nombres,
    //    tipo:cliente.tipo})
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el registro' });
  }
});

module.exports = router;



