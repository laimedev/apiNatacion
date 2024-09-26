const express = require('express');
const router = express.Router();
const moment = require('moment');
const Inscripciones = require('../models/Inscripciones');
const Pagos = require('../models/Pagos');
const Horarios = require('../models/Horarios');
const ExcelJS = require('exceljs');


// Crear una nueva inscripción y su respectivo pago
// Crear una nueva inscripción y su respectivo pago
router.post('/create', async (req, res) => {
  try {
    const { costoTarifa, codAlumno, codTalleres, codCliente, codHorario, importePago, venta_id, tiempo, clases, email, dias, horario } = req.body;

    // Verificar la cantidad de vacantes disponibles
    const vacantesDisponibles = await Horarios.getVacantes(codHorario);
    
    // Si no hay vacantes disponibles, retornar error
    if (vacantesDisponibles === 0) {
      return res.status(400).json({ success: false, message: 'No hay vacantes disponibles para este horario' });
    }
    
    // Disminuir 1 vacante en el horario seleccionado
    const updatedVacantes = await Horarios.updateVacantes(codHorario);
    if (updatedVacantes === 0) {
      return res.status(400).json({ success: false, message: 'No se pudo reducir vacantes. Puede que no haya vacantes disponibles.' });
    }

    // Insertar la inscripción en la tabla Inscripciones
    const inscripcionData = {
      fechaInscripcion: moment().format('YYYY-MM-DD HH:mm:ss'), // Fecha actual
      costoTarifa,
      codAlumno,
      codTalleres,
      codCliente,
      codUsuario: 5,  // CodUsuario por defecto es 5
      codHorario,
      tiempo,    // Duración de las clases (ejemplo: "2 horas")
      clases,    // Número de clases
      email,      // Email del usuario que se inscribe
      dias,
      horario
    };

    const codInscripcion = await Inscripciones.create(inscripcionData);

    // Insertar el pago en la tabla Pagos
    const pagoData = {
      fechaPago: moment().format('YYYY-MM-DD HH:mm:ss'), // Fecha actual
      metodoPago: 'PASARELA IZIPAY', // Método de pago
      importePago,
      venta_id,
      codInscripcion
    };

    await Pagos.create(pagoData);

    return res.status(201).json({ success: true, message: 'Inscripción y pago realizados correctamente', codInscripcion });
  } catch (error) {
    console.error('Error en la inscripción y pago:', error);
    return res.status(500).json({ success: false, message: 'Error al realizar la inscripción y pago', error });
  }
});




// Ruta para obtener inscripciones y sus pagos mediante el codCliente
router.get('/cliente/:codCliente', async (req, res) => {
    const codCliente = req.params.codCliente;
  
    try {
      // Obtener inscripciones y pagos
      const inscripciones = await Inscripciones.getByClienteWithPayments(codCliente);
  
      if (inscripciones.length === 0) {
        return res.status(404).json({ message: 'No se encontraron inscripciones para el cliente.' });
      }
  
      return res.status(200).json(inscripciones);
    } catch (error) {
      console.error('Error al obtener inscripciones con pagos:', error);
      return res.status(500).json({ message: 'Error al obtener inscripciones con pagos', error });
    }
  });

  

  router.get('/list', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || '';
    const codTalleres = req.query.codTalleres || '';  // Filtrar por codTalleres
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
  
    try {
      const { inscripciones, total } = await Inscripciones.getByFilters(page, limit, searchTerm, codTalleres, startDate, endDate);
      
      res.status(200).json({ data: inscripciones, total });
    } catch (error) {
      console.error('Error al listar inscripciones:', error);
      res.status(500).json({ error: 'Error al listar inscripciones' });
    }
  });



  // Ruta para eliminar una inscripción y sus pagos
router.delete('/delete/:codInscripcion', async (req, res) => {
  const codInscripcion = req.params.codInscripcion;

  try {
    // Llamar a la función para eliminar la inscripción y sus pagos
    const result = await Inscripciones.deleteById(codInscripcion);
    
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error al eliminar inscripción y pagos:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar inscripción y pagos' });
  }
});





// Ruta para actualizar clasesCompleta
router.post('/update-clases-completa/:codInscripcion', async (req, res) => {
  const codInscripcion = req.params.codInscripcion;
  const { clasesCompletas } = req.body;

  if (clasesCompletas === undefined) {
    return res.status(400).json({ error: 'El campo clasesCompleta es requerido.' });
  }

  try {
    const result = await Inscripciones.updateClasesCompleta(codInscripcion, clasesCompletas);

    if (result > 0) {
      res.status(200).json({ success: 'La columna clasesCompleta fue actualizada exitosamente.' });
    } else {
      res.status(404).json({ error: 'Inscripción no encontrada.' });
    }
  } catch (error) {
    console.error('Error al actualizar clasesCompleta:', error);
    res.status(500).json({ error: 'Error al actualizar clasesCompleta.' });
  }
});








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
      { header: 'Horario', key: 'horario', width: 30 },
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
      { header: 'Apellido Cliente', key: 'primer_apellido', width: 20 },
      { header: 'Apellido Cliente', key: 'segundo_apellido', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email Cliente', key: 'emailCliente', width: 30 },
      { header: 'Documento', key: 'numDocumento', width: 15 },
      { header: 'Tipo Cliente', key: 'tipoCliente', width: 20 }
    ];

    // Añadir estilos a la cabecera
    worksheet.getRow(1).font = { bold: true };

    // Añadir los datos al archivo Excel
    data.forEach((inscripcion) => {
      worksheet.addRow({
        codInscripcion: inscripcion.codInscripcion,
        nombreTaller: inscripcion.nombreTaller,
        dias: inscripcion.dias,
        horario: inscripcion.horario[0]?.hora || 'No definido', // Mostrar el primer horario si es un array
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




module.exports = router;
