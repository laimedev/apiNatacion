require("dotenv").config()
const express = require("express")
const session = require('express-session')
const app = express()
const cors = require("cors")
const port = process.env.PORT||5001
const dbConnection = require('./core/db_config');
const testRouter = require("./routes/test")
const registerRouter = require("./routes/register")
const authRouter = require("./routes/auth")
const listadoRegistro = require("./routes/listadoRegistro")
const registroCliente = require("./routes/registroCliente")
const localidadRouter = require("./routes/localidad")
const clienteRouter = require("./routes/cliente")
const clientesTea = require("./routes/teatro/clienteTeaRouter")
const SolicitudTea = require("./routes/teatro/solicitudTeaRouter")


const Contacto = require("./routes/contactos")
const Clientes = require("./routes/cliente")
const Alumnos = require("./routes/alumnos")
const Talleres = require("./routes/talleres")
const Horarios = require("./routes/horarios")
const Usuarios = require("./routes/usuarios")
const Inscripciones = require("./routes/inscripciones")
const Extras = require("./routes/extras")

const ipn = require("./routes/ipn")

const { createFormToken } = require('./createPayment')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const Hex = require('crypto-js/enc-hex')
const forgotPassword = require("./routes/forgotPassword")
const moment = require('moment-timezone');
const ipRangeCheck = require('ip-range-check');

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger'); // Importa tu configuración de Swagger


const  fileUpload = require("express-fileupload");
const fs = require('fs');




app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())

app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/'
}));





app.use("/api/test",testRouter)
app.use("/api/register",registerRouter)
app.use("/api/auth",authRouter)
app.use("/api/listado-Registro", listadoRegistro)
app.use("/api/registro-cliente", registroCliente)
app.use("/api/localidad", localidadRouter)
app.use("/api/cliente",clienteRouter)
app.use("/api/forgot-password",forgotPassword)
app.use("/api/ipn",ipn)

app.use("/api/teatro/client", clientesTea)
app.use("/api/teatro/application", SolicitudTea);


app.use("/api/contacto", Contacto);
app.use("/api/cliente", Clientes);
app.use("/api/alumno", Alumnos);
app.use("/api/taller", Talleres);
app.use("/api/horario", Horarios);
app.use("/api/usuario", Usuarios);
app.use("/api/inscripcion", Inscripciones);
app.use("/api/extras", Extras);






app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// Rutas de tu aplicación
// app.use('/api', searchRouter); // Asegúrate de usar el prefijo adecuado para tus rutas


app.get('/current-time', (req, res) => {
  const currentTime = moment().tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');

  res.send(currentTime);
});

app.post('/createPayment', async (req, res) => {
  const paymentConf = req.body.paymentConf

  try {
    const formToken = await createFormToken(paymentConf)
    res.send(formToken)
  } catch (error) {
    console.log({error})
    res.status(500).send(error)
  }
})

app.post('/validatePayment', (req, res) => {
let hmac
  if(process.env.MODE === "TEST") {
    hmac = process.env.IZIPAY_HMAC_TEST;
  }
  else {
    hmac = process.env.IZIPAY_HMAC;
  }
  const answer = req.body.clientAnswer
  
  const hash = req.body.hash
  const answerHash = Hex.stringify(
    hmacSHA256(JSON.stringify(answer), hmac)
  )
  if (hash === answerHash) res.status(200).send('Valid payment')
  else res.status(500).send('Payment hash mismatch')
})


dbConnection()
  .then((connection) => {
    console.log('Successful connection to the database.');
    connection.release();
    app.listen(port, () => {
      console.log('API Server of tennis running');
    });
  })
  .catch((error) => {
    console.error('Error connecting to database: ', error);
  });
