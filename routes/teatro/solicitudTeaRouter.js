const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const  SolicitudTea  = require('../../models/teatro/solicitudTea'); // Asumiendo que tienes un modelo llamado 
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');


const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: 'laimedev',
  api_key: '514357759962521',
  api_secret: '1KGNTYZhwe_7TMXNLwvNR6SCWwQ'
})



// Ruta de registro
router.post('/register', async (req, res) => {
  try {
    const { codClienteTemuss, categoria_propuesta } = req.body;

    // Verificar si ya existe un registro con el mismo codClienteTemuss y categoria_propuesta
    const existingRecord = await SolicitudTea.findOneCategoriaPorpuesta({
      codClienteTemuss,
      categoria_propuesta
    });

    if (existingRecord) {
      return res.status(400).json({
        error: `La categoría de la propuesta '${categoria_propuesta}' ya ha sido registrada para este usuario. No se puede registrar más de una propuesta con la misma categoría.`
      });
    }

    // Crear una instancia del nuevo registro con los datos proporcionados
    const formData = {
      // Datos del postulante
      codClienteTemuss: req.body.codClienteTemuss || null,
      porcentajeProgreso: req.body.porcentajeProgreso || null,

      tipo_persona: req.body.tipo_persona || null,
      nombre_postulante: req.body.nombre_postulante || null,
      razon_social: req.body.razon_social || null,
      nombre_representante_legal: req.body.nombre_representante_legal || null,
      tipo_documento: req.body.tipo_documento || null,
      num_documento: req.body.num_documento || null,
      lugar_residencia: req.body.lugar_residencia || null,
      email: req.body.email || null,
      num_registro_unico: req.body.num_registro_unico || null,
      telefono: req.body.telefono || null,
      resumen_trayectoria: req.body.resumen_trayectoria || null,

      // Datos de la propuesta
      categoria_propuesta: req.body.categoria_propuesta || null,
      propuesta_artistica: req.body.propuesta_artistica || null,
      titulo_propuesta: req.body.titulo_propuesta || null,
      sinopsis_propuesta: req.body.sinopsis_propuesta || null,
      resumen_propuesta: req.body.resumen_propuesta || null,
      objetivo_propuesta: req.body.objetivo_propuesta || null,
      utileria: req.body.utileria || null,
      requerimientos: req.body.requerimientos || null,
      publico_objetivo: req.body.publico_objetivo || null,
      duracion_aprox: req.body.duracion_aprox || null,
      integrantes_propuesta: req.body.integrantes_propuesta || null,
      titulos_creditos: req.body.titulos_creditos || null,
      incluye_obras: req.body.incluye_obras || null,
      fechas_propuesta_start: req.body.fechas_propuesta_start || null,
      fechas_propuesta_end: req.body.fechas_propuesta_end || null,
      contenido_propuesta: req.body.contenido_propuesta || null,
      precio_entrada: req.body.precio_entrada || null,

      // Declaraciones
      decla_bajo_juramento: req.body.decla_bajo_juramento || null,
      decla_sentencia_deli: req.body.decla_sentencia_deli || null,
      autorizacion_titulares: req.body.autorizacion_titulares || null,
      declar_propuesta: req.body.declar_propuesta || null,
      compromiso_brindar: req.body.compromiso_brindar || null,
      responsable_veracidad: req.body.responsable_veracidad || null,
      acepto_compromisos: req.body.acepto_compromisos || null,
    };

    // Manejo de la firma (archivo)
    if (req.files && req.files.firma) {
      const imagenPath = req.files.firma.tempFilePath;
      const resp = await cloudinary.uploader.upload(imagenPath, {
        folder: "reservation/admin",
        public_id: `${Date.now()}`,
        width: 550,
      });
      formData.firma = resp.secure_url;
    } else if (req.body.firma) {
      formData.firma = req.body.firma;
    }

    // Guardar el registro en la base de datos
    const insertId = await SolicitudTea.create(formData);
    return res.status(200).json({ success: 'Registrado exitosamente.', id: insertId });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ error: 'Error en el registro' });
  }
});

  


// Ruta de actualización
router.post('/edit/:codSolicitud', async (req, res) => {
  try {
    const codSolicitud = req.params.codSolicitud;
    const { codClienteTemuss, categoria_propuesta } = req.body;

    // Obtener el registro actual para verificar la categoría de propuesta
    const currentRecord = await SolicitudTea.findById(codSolicitud);
    if (!currentRecord) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }

    // Verificar si la nueva categoría de propuesta es diferente a la actual
    if (currentRecord.categoria_propuesta !== categoria_propuesta) {
      // Buscar si la nueva categoría de propuesta ya está registrada para el cliente
      const existingRecord = await SolicitudTea.findOneCategoriaPorpuesta({
        codClienteTemuss,
        categoria_propuesta
      });

      if (existingRecord) {
        return res.status(400).json({
          error: `La categoría de propuesta '${categoria_propuesta}' ya ha sido registrada para este cliente. No se puede actualizar a una categoría duplicada.`
        });
      }
    }

    // Crear un objeto formData solo con los campos presentes en req.body
    let formData = { ...req.body };

    // Eliminar campos vacíos o nulos del objeto formData
    Object.keys(formData).forEach(key => {
      if (formData[key] === "" || formData[key] === "null") {
        delete formData[key];
      }
    });

    // Manejo de la firma (archivo)
    if (req.files && req.files.firma) {
      const imagenPath = req.files.firma.tempFilePath;
      const resp = await cloudinary.uploader.upload(imagenPath, {
        folder: "reservation/admin",
        public_id: `${Date.now()}`,
        width: 550,
      });
      formData.firma = resp.secure_url;
    } else if (req.body.firma) {
      // Solo asignar si la firma no está vacía
      formData.firma = req.body.firma;
    }

    // Actualizar el registro en la base de datos
    await SolicitudTea.update(codSolicitud, formData);
    return res.status(200).json({ success: 'Actualizado exitosamente.' });
  } catch (error) {
    console.error('Error en la actualización:', error);
    return res.status(500).json({ error: 'Error en la actualización' });
  }
});



// Ruta para obtener un usuario por su ID
router.get('/:codClienteTemuss/list', async (req, res) => {
    try {
      const codClienteTemuss = req.params.codClienteTemuss;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
  
      // Obtener usuarios con paginación y búsqueda utilizando la función getUsersByCodClienteTemuss del modelo
      const { users, total } = await SolicitudTea.getListUserById(
        codClienteTemuss,
        page,
        limit,
        search,
        startDate,
        endDate
      );
  
      return res.status(200).json({ data: users, total });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener la lista de solicitudes' });
    }
  });



  router.get('/list', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
  
      // Obtener usuarios con paginación y búsqueda
      const { users, total } = await SolicitudTea.getListSolciitudes(
        page,
        limit,
        search,
        startDate,
        endDate
      );
  
      return res.status(200).json({ data: users, total });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener la lista de solicitudes' });
    }
  });

  


  router.get('/:codSolicitud', async (req, res) => {
    const codSolicitud = req.params.codSolicitud;
    try {
      const user = await SolicitudTea.getSolicitudById(codSolicitud);
      if (!user) {
        return res.status(404).json({ error: 'Solicitud no encontrado' });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener el solicitud' });
    }
  });

  
  router.delete('/delete/:codSolicitud', async (req, res) => {
    const codSolicitud = req.params.codSolicitud;
    try {
      await SolicitudTea.deleteSolicitudById(codSolicitud);
  
      return res.status(200).json({ success: 'Solicitud eliminada correctamente' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al eliminar el solciitud' });
    }
  });





// Ruta para enviar el correo con detalles de la solicitud
router.post('/send-solicitud-email', async (req, res) => {
  const { email, codSolicitud } = req.body;
  if (!email || !codSolicitud) {
    return res.status(400).json({ error: 'El correo electrónico y el código de solicitud son requeridos.' });
  }

  try {
    // Buscar la solicitud por ID
    const solicitud = await SolicitudTea.getSolicitudById(codSolicitud);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    // Configuración del transporte de Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Crear el contenido del correo
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Detalles de la Solicitud: Convocatoria programación 2025',
      html: `
       <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
          }
          th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
          }
          td {
            font-family: Arial, sans-serif;
          }
          .center {
            text-align: center;
          }
          .header {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            font-size: 18px;
          }
        </style>
      </head>
      <body>

        <br />
        <table>
          <thead>
            <tr>
              <th colspan="2" class="header">A. CARTA DE PRESENTACIÓN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: right; font-weight: bold;">Setiembre 2024</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 20px;">
                <p><strong>Asunto:</strong> CONVOCATORIA PARA LA PROGRAMACIÓN DEL TEATRO MUNICIPAL DE SANTIAGO DE SURCO 2025</p>
                <p>
                  Atención: Sr Paul Alexander Cañamero Álvarez<br />
                  Gerente General La Empresa Municipal de Santiago de Surco EMUSS S.A<br />
                  Presente,
                </p>
                <p>
                  Por medio de esta carta, remito el formulario de postulación a la convocatoria para la programación artística 2025 del Teatro Municipal de Santiago de Surco.
                </p>
                <p>
                  Solicito, por favor, se remita el presente documento al Teatro Municipal de Santiago de Surco.
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        <!-- Imagen centrada al final -->
        <div style="text-align: center;">
          <img src="${process.env.LOGO}" alt="Imagen Final" style="width: 220px; height: auto;" />
        </div>

        <br />


        <table>
          <thead>
            <tr>
              <th colspan="3" class="header">SOBRE EL POSTULANTE</th>
            </tr>
            <tr>
              <th class="center" style="width: 5%;">#</th>
              <th style="width: 35%;">Título</th>
              <th style="width: 60%;">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">1</td>
              <td>Usted se presenta a la siguiente convocatoria como</td>
              <td>${solicitud.tipo_persona || ''}</td>
            </tr>
            <tr>
              <td class="center">2</td>
              <td>Nombre del postulante</td>
              <td>${solicitud.nombre_postulante || ''}</td>
            </tr>
            <tr>
              <td class="center">3</td>
              <td>Razón social / Nombre comercial</td>
              <td>${solicitud.razon_social || ''}</td>
            </tr>
            <tr>
              <td class="center">4</td>
              <td>Nombre del representante legal</td>
              <td>${solicitud.nombre_representante_legal || ''}</td>
            </tr>
            <tr>
              <td class="center">5</td>
              <td>Tipo y número de documento del representante legal</td>
              <td>${solicitud.tipo_documento  || ''}</td>
            </tr>
            <tr>
              <td class="center">6</td>
              <td>Lugar de residencia</td>
              <td>${solicitud.lugar_residencia || ''}</td>
            </tr>
            <tr>
              <td class="center">7</td>
              <td>Número de Registro Único de Contribuyentes</td>
              <td>${solicitud.num_registro_unico || ''}</td>
            </tr>
            <tr>
              <td class="center">8</td>
              <td>Correo electrónico de contacto</td>
              <td>${solicitud.email || ''}</td>
            </tr>
            <tr>
              <td class="center">9</td>
              <td>Teléfono de contacto</td>
              <td>${solicitud.telefono || ''}</td>
            </tr>
            <tr>
              <td class="center">10</td>
              <td>Resumen de la trayectoria y experiencia</td>
              <td>${solicitud.resumen_trayectoria || ''}</td>
            </tr>
          </tbody>
        </table>
        <br />

      <table>
      <!-- Cabecera con una sola columna que dice "SOBRE PROPUESTA ARTÍSTICA" -->
      <thead>
        <tr>
          <th colspan="3" class="header">C. SOBRE PROPUESTA ARTÍSTICA</th>
        </tr>
        <tr>
          <th class="center" style="width: 5%;">#</th>
          <th style="width: 35%;">Título</th>
          <th style="width: 60%;">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center">1</td>
          <td>Categoría de la propuesta artística</td>
          <td>${solicitud.categoria_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">2</td>
          <td>La propuesta artística presentada en esta convocatoria es</td>
          <td>${solicitud.propuesta_artistica || ''}</td>
        </tr>
        <tr>
          <td class="center">3</td>
          <td>Título de la propuesta artística</td>
          <td>${solicitud.titulo_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">4</td>
          <td>Sinopsis de la propuesta artística</td>
          <td>${solicitud.sinopsis_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">5</td>
          <td>Resumen de la propuesta artística</td>
          <td>${solicitud.resumen_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">6</td>
          <td>Objetivos de la propuesta artística</td>
          <td>${solicitud.objetivo_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">7</td>
          <td>Utilería, vestuario y escenografía</td>
          <td>${solicitud.utileria || ''}</td>
        </tr>
        <tr>
          <td class="center">8</td>
          <td>Requerimientos técnicos</td>
          <td>${solicitud.requerimientos || ''}</td>
        </tr>
        <tr>
          <td class="center">9</td>
          <td>Público objetivo</td>
          <td>${solicitud.publico_objetivo || ''}</td>
        </tr>
        <tr>
          <td class="center">10</td>
          <td>Duración aproximada de la propuesta artística</td>
          <td>${solicitud.duracion_aprox || ''}</td>
        </tr>
        <tr>
          <td class="center">11</td>
          <td>Integrantes de la propuesta artística</td>
          <td>${solicitud.integrantes_propuesta || ''}</td>
        </tr>

        <tr>
          <td class="center">12</td>
          <td>Título y crédito completo de la obra u obras de la propuesta artística</td>
          <td>${solicitud.titulos_creditos || ''}</td>
        </tr>
        <tr>
          <td class="center">13</td>
          <td>¿La propuesta artística incluye obras registradas en alguna sociedad de gestión colectiva?</td>
          <td>${solicitud.incluye_obras || ''}</td>
        </tr>
        <tr>
          <td class="center">14</td>
          <td>Contenidos de la propuesta artística</td>
          <td>${solicitud.contenido_propuesta || ''}</td>
        </tr>
        <tr>
          <td class="center">15</td>
          <td>Fechas tentativas</td>
          <td>Desde: ${solicitud.fechas_propuesta_start || 'No disponible'}<br>Hasta: ${solicitud.fechas_propuesta_end || 'No disponible'}</td>
        </tr>
        <tr>
          <td class="center">16</td>
          <td>Precio de entrada tentativa</td>
          <td>${solicitud.precio_entrada || ''}</td>
        </tr>

      </tbody>
      </table>



      <br />
      <table>
        <!-- Cabecera para "DECLARACIONES JURADAS Y COMPROMISOS" -->
        <thead>
          <tr>
            <th colspan="2" class="header">DECLARACIONES JURADAS Y COMPROMISOS</th>
          </tr>
          <tr>
            <th class="center" style="width: 5%;">Sí</th>
            <th style="width: 95%;">Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="center">${solicitud.decla_bajo_juramento ? 'Sí' : 'No'}</td>
            <td>Declaro bajo juramento que tengo conocimiento de que, en caso de comprobarse fraude o falsedad en la declaración, información o en la documentación que presento, la Empresa Municipal de Santiago de Surco EMUSS S.A y la Municipalidad de Santiago de Surco considerarán no satisfechas las exigencias antes descritas para todos sus efectos...</td>
          </tr>
          <tr>
            <td class="center">${solicitud.decla_sentencia_deli ? 'Sí' : 'No'}</td>
            <td>No mantengo sentencia firme por delitos contra la fe pública, delitos contra el patrimonio, entre otros similares.</td>
          </tr>
          <tr>
            <td class="center">${solicitud.autorizacion_titulares ? 'Sí' : 'No'}</td>
            <td>Tengo la autorización del (los) titular(es) de los derechos patrimoniales de autor de las obras que forman parte de la propuesta artística con la que postulo a la presente convocatoria...</td>
          </tr>
          <tr>
            <td class="center">${solicitud.declar_propuesta ? 'Sí' : 'No'}</td>
            <td>En caso mi propuesta sea seleccionada me comprometo a brindar las autorizaciones y/o cesiones correspondientes a efectos de que la Empresa Municipal de Santiago de Surco EMUSS S.A. y la Municipalidad de Santiago de Surco puedan comunicar al público...</td>
          </tr>
          <tr>
            <td class="center">${solicitud.compromiso_brindar ? 'Sí' : 'No'}</td>
            <td>En caso mi proyecto sea seleccionado me comprometo a brindar las autorizaciones correspondientes de uso de mi imagen, a efectos de que la Empresa Municipal de Santiago de Surco EMUSS S.A y la Municipalidad de Santiago de Surco puedan difundir mi imagen en la programación...</td>
          </tr>
          <tr>
            <td class="center">${solicitud.responsable_veracidad ? 'Sí' : 'No'}</td>
            <td>Me comprometo a brindar todos los documentos e información que se requieran para los efectos de la presente convocatoria.</td>
          </tr>
          <tr>
            <td class="center">${solicitud.acepto_compromisos ? 'Sí' : 'No'}</td>
            <td>He leído y acepto todos los compromisos y obligaciones estipulados en las bases de la presente convocatoria.</td>
          </tr>
        </tbody>
      </table>


      <br />
      <table>
        <thead>
          <tr>
            <th colspan="1" class="header">E. FIRMA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="center">
              <!-- Imagen de la firma, asegurándose de que la URL o base64 esté en solicitud.firma -->
              <img src="${solicitud.firma || 'https://temuss.pe/wp-content/uploads/2024/08/LOGO_TEATRO_MUNICIPAL_letras-azules-1.png'}" alt="Firma" style="width: 150px; height: auto;" />
            </td>
          </tr>
          <tr>
            <td class="center">
              <!-- Datos dinámicos del nombre y representante -->
              <p>${solicitud.nombre_postulante || 'Nombre del firmante'}</p>
              <p>${solicitud.num_documento || 'Documento de identidad'}</p>
              <p>Representante de: ${solicitud.razon_social || 'Entidad representada'}</p>
            </td>
          </tr>
        </tbody>
      </table>




        <br>
        <p>Por favor, revise su información antes de enviarla.</p>
      </body>
    </html>
      `,
    };

    // Enviar el correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error al enviar el correo.' });
      }
      return res.status(200).json({ message: 'Correo enviado exitosamente.' });
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

  module.exports = router;
