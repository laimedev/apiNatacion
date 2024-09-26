const express = require('express');
const router = express.Router();
const Horarios = require('../models/Horarios');
const ExcelJS = require('exceljs');
const { check, validationResult } = require('express-validator');

// Crear un nuevo horario
router.post('/create', async (req, res) => {
  try {
    const { codTalleres, dias, horario, tiempo, precio, precioSurcano, sesiones, vacantes, codInstructor, estado } = req.body;

    // Construir el objeto con los datos para el horario
    const horarioData = {
      codTalleres,
      dias,
      horario, // Aquí el horario será procesado en el modelo según se pase vacío o con un texto plano
      tiempo,
      precio,
      precioSurcano,
      sesiones,
      vacantes,
      codInstructor,
      estado: estado || 'ACTIVO', // Establecer el estado como INACTIVO por defecto si no se pasa
      creacion: new Date().toISOString()
    };

    // Llamar al modelo para crear el horario
    const codHorario = await Horarios.create(horarioData);

    return res.status(201).json({ success: true, message: 'Horario creado correctamente', codHorario });
  } catch (error) {
    console.error('Error al crear el horario:', error);
    return res.status(500).json({ success: false, message: 'Error al crear el horario', error });
  }
});


// Actualizar un horario
router.post('/edit/:codHorario', async (req, res) => {
  try {
    const codHorario = req.params.codHorario;
    const formData = req.body;

    // Obtener el horario actual
    const currentHorario = await Horarios.findById(codHorario);
    if (!currentHorario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Actualizar el horario con el modelo
    await Horarios.update(codHorario, formData);

    res.status(200).json({ success: 'Horario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el horario:', error);
    res.status(500).json({ error: 'Error al actualizar el horario' });
  }
});


// Ruta para obtener un horario por su ID (codHorario)
router.get('/getById/:codHorario', async (req, res) => {
  try {
    const codHorario = req.params.codHorario;

    // Llamar a la función del modelo para obtener el horario por ID
    const result = await Horarios.getHorarioById(codHorario);

    // Si no se encuentra el horario, devolver mensaje de error
    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    // Responder con la información del horario
    return res.status(200).json(result.horario);
  } catch (error) {
    console.error('Error al obtener el horario por ID:', error);
    return res.status(500).json({ error: 'Error al obtener el horario' });
  }
});


// Cambiar el estado de un horario
router.post('/changeStatus/:codHorario', [
  check('estado').isIn(['ACTIVO', 'INACTIVO']).withMessage('El estado debe ser ACTIVO o INACTIVO')
], async (req, res) => {
  try {
    const codHorario = req.params.codHorario;
    const { estado } = req.body;

    // Verificar si el horario existe
    const currentHorario = await Horarios.findById(codHorario);
    if (!currentHorario) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Cambiar el estado del horario
    await Horarios.changeStatus(codHorario, estado);
    res.status(200).json({ success: `Estado del horario actualizado a ${estado}` });
  } catch (error) {
    console.error('Error al cambiar el estado del horario:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del horario' });
  }
});

// Listar horarios con filtros
router.get('/listNatacion', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { horarios, total } = await Horarios.getHorariosNatacion(page, limit, searchTerm, status, startDate, endDate);
    res.status(200).json({ data: horarios, total });
  } catch (error) {
    console.error('Error al listar los horarios:', error);
    res.status(500).json({ error: 'Error al listar los horarios' });
  }
});



// Listar horarios con filtros
router.get('/listVoley', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { horarios, total } = await Horarios.getHorariosVoley(page, limit, searchTerm, status, startDate, endDate);
    res.status(200).json({ data: horarios, total });
  } catch (error) {
    console.error('Error al listar los horarios:', error);
    res.status(500).json({ error: 'Error al listar los horarios' });
  }
});



// Listar horarios con filtros
router.get('/listBasquet', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { horarios, total } = await Horarios.getHorariosBasquet(page, limit, searchTerm, status, startDate, endDate);
    res.status(200).json({ data: horarios, total });
  } catch (error) {
    console.error('Error al listar los horarios:', error);
    res.status(500).json({ error: 'Error al listar los horarios' });
  }
});



// Eliminar un horario por ID
router.delete('/delete/:codHorario', async (req, res) => {
    try {
      const codHorario = req.params.codHorario;
  
      // Verificar si el horario existe
      const horario = await Horarios.findById(codHorario);
      if (!horario) {
        return res.status(404).json({ error: 'Horario no encontrado' });
      }
  
      // Eliminar el horario
      await Horarios.deleteById(codHorario);
      res.status(200).json({ success: 'Horario eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar el horario:', error);
      return res.status(500).json({ error: 'Error al eliminar el horario' });
    }
  });


  
// Exportar horarios a Excel
// Router para exportar inscripciones a un archivo Excel
router.post('/export-inscripciones', async (req, res) => {
  try {
    // Obtener datos de inscripciones desde el modelo
    const data = await Inscripciones.exportInscripciones();

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscripciones');

    // Encabezados de las columnas
    worksheet.columns = [
      { header: 'ID Inscripción', key: 'codInscripcion', width: 15 },
      { header: 'Nombre Taller', key: 'nombreTaller', width: 20 },
      { header: 'Días', key: 'dias', width: 15 },
      { header: 'Horario', key: 'horario', width: 30 }, // Mostrar solo el primer horario si es un array
      { header: 'Fecha Inscripción', key: 'fechaInscripcion', width: 20 },
      { header: 'Costo Tarifa', key: 'costoTarifa', width: 15 },
      { header: 'Clases Completas', key: 'clasesCompletas', width: 15 },
      { header: 'Tiempo', key: 'tiempo', width: 15 },
      { header: 'Clases', key: 'clases', width: 10 },
      { header: 'Email Inscripción', key: 'emailInscripcion', width: 30 },
      { header: 'Fecha Pago', key: 'fechaPago', width: 20 },
      { header: 'Método Pago', key: 'metodoPago', width: 20 },
      { header: 'Importe Pago', key: 'importePago', width: 15 },
      { header: 'Venta ID', key: 'venta_id', width: 15 },
      { header: 'Nombre Cliente', key: 'nombres', width: 20 },
      { header: 'Primer Apellido Cliente', key: 'primer_apellido', width: 20 },
      { header: 'Segundo Apellido Cliente', key: 'segundo_apellido', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email Cliente', key: 'emailCliente', width: 30 },
      { header: 'Documento', key: 'numDocumento', width: 15 },
      { header: 'Tipo Cliente', key: 'tipoCliente', width: 20 }
    ];

    // Añadir estilo al encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1872A1' } // Azul para la cabecera
      };
    });

    // Añadir los datos al archivo Excel y aplicar estilos según el título del taller
    data.forEach((inscripcion) => {
      const row = worksheet.addRow({
        codInscripcion: inscripcion.codInscripcion,
        nombreTaller: inscripcion.nombreTaller,
        dias: inscripcion.dias,
        horario: inscripcion.horario.length ? inscripcion.horario[0]?.hora : 'No definido', // Mostrar solo el primer elemento del array "horario"
        fechaInscripcion: inscripcion.fechaInscripcion,
        costoTarifa: inscripcion.costoTarifa,
        clasesCompletas: inscripcion.clasesCompletas,
        tiempo: inscripcion.tiempo,
        clases: inscripcion.clases,
        emailInscripcion: inscripcion.emailInscripcion,
        fechaPago: inscripcion.fechaPago,
        metodoPago: inscripcion.metodoPago,
        importePago: inscripcion.importePago,
        venta_id: inscripcion.venta_id,
        nombres: inscripcion.nombres,
        primer_apellido: inscripcion.primer_apellido,
        segundo_apellido: inscripcion.segundo_apellido,
        telefono: inscripcion.telefono,
        emailCliente: inscripcion.emailCliente,
        numDocumento: inscripcion.numDocumento,
        tipoCliente: inscripcion.tipoCliente
      });

      // Establecer color de fondo según el nombre del taller
      let bgColor;
      switch (inscripcion.nombreTaller) {
        case 'Natación':
          bgColor = 'B9D6EC'; // Celeste
          break;
        case 'Voley':
          bgColor = 'E0CAF0'; // Melón
          break;
        case 'Básquet':
          bgColor = 'ECD6B9'; // Naranja
          break;
        case 'Fútbol':
          bgColor = 'C2E296'; // Verde
          break;
        default:
          bgColor = 'FFFFFFFF'; // Blanco (por si no coincide con ningún taller)
          break;
      }

      // Aplicar el color de fondo a cada celda de la fila
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
      });
    });

    // Generar el archivo Excel y enviarlo como respuesta
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inscripciones.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Error al exportar las inscripciones a Excel:', error);
    return res.status(500).json({ error: 'Error al exportar las inscripciones a Excel' });
  }
});





  // Ruta para obtener horarios por codTalleres
  router.get('/taller/:codTalleres', async (req, res) => {
    const codTalleres = req.params.codTalleres;

    try {
      // Obtener horarios según el codTalleres
      const horarios = await Horarios.getByTallerId(codTalleres);

      if (horarios.length === 0) {
        return res.status(404).json({ message: 'No se encontraron horarios para el taller especificado.' });
      }

      return res.status(200).json(horarios);
    } catch (error) {
      console.error('Error al obtener horarios:', error);
      return res.status(500).json({ message: 'Error al obtener los horarios', error });
    }
  });


module.exports = router;