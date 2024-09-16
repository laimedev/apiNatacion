const express = require('express');
const router = express.Router();
const Cliente = require('../models/Clientes');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { email } = req.body;
  if (email === '') {
    return res.status(400).json({
      error: "El email es requerido"
    });
  }

  try {
    const cliente = await Cliente.findOne({ email });
    if (!cliente) {
      return res.status(403).json({ error: 'No existe el email' });
    }
    const token = jwt.sign({ clienteId: cliente.codCliente }, process.env.JWT_SEC, { expiresIn: "1h" });

    await Cliente.updateToken(cliente.codCliente, token);

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
            <h1>¡Gracias por solicitar recuperar contraseña en Surco Tenis!</h1>
            <p>Hola ${cliente.nombres},</p>
            <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
            <a href="https://reservas.surcotenis.pe/#/reserve/reset-password?token=${token}">Restablecer contraseña</a>
            <p>El enlace es válido por 1 hora.</p>
            <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
            <p>Saludos,</p>
            <p>El equipo de de Surco Tenis</p>
            <img src="https://surcotenis.pe/wp-content/uploads/2023/05/logo-300x140.png" alt="Descripción de la imagen">
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

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
  
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SEC);
        const clienteId = decodedToken.clienteId;

        const passwordValidation = validatePassword(password);
        if (passwordValidation !== 'valid') {
          return res.status(400).json({ error: passwordValidation });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Cliente.updatePassword(clienteId, hashedPassword);
        res.status(200).json({ message: 'Contraseña reseteada exitosamente.' });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });

  function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return 'La contraseña debe tener al menos 8 caracteres  al menos una letra mayúscula, una letra minúscula, un número y un carácter especial como estos @$!%*?&#. ';
    }  
    return 'valid';
}

module.exports = router;
