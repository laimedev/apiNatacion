const express = require('express');
const router = express.Router();
const moment = require('moment');
const Inscripciones = require('../models/Inscripciones');
const Pagos = require('../models/Pagos');
const Horarios = require('../models/Horarios');
const ExcelJS = require('exceljs');
const Alumnos = require('../models/Alumnos');


// Crear una nueva inscripción y su respectivo pago

// router.post('/create', async (req, res) => {
//   try {
//     const { costoTarifa, codAlumno, codTalleres, codCliente, codHorario, metodoPago, importePago, venta_id, tiempo, clases, email, dias, horario } = req.body;
//     const vacantesDisponibles = await Horarios.getVacantes(codHorario);
//     if (vacantesDisponibles === 0) {
//       return res.status(400).json({ success: false, message: 'No hay vacantes disponibles para este horario' });
//     }
//     const updatedVacantes = await Horarios.updateVacantes(codHorario);
//     if (updatedVacantes === 0) {
//       return res.status(400).json({ success: false, message: 'No se pudo reducir vacantes. Puede que no haya vacantes disponibles.' });
//     }
//     const inscripcionData = {
//       fechaInscripcion: moment().format('YYYY-MM-DD HH:mm:ss'), 
//       costoTarifa,
//       codAlumno,
//       codTalleres,
//       codCliente,
//       codUsuario: 5, 
//       codHorario,
//       tiempo,   
//       clases,    
//       email,     
//       dias,
//       horario
//     };
//     const codInscripcion = await Inscripciones.create(inscripcionData);
//     const pagoData = {
//       fechaPago: moment().format('YYYY-MM-DD HH:mm:ss'), 
//       metodoPago, 
//       importePago,
//       venta_id,
//       codInscripcion
//     };
//     await Pagos.create(pagoData);
//     return res.status(201).json({ success: true, message: 'Inscripción y pago realizados correctamente', codInscripcion });
//   } catch (error) {
//     console.error('Error en la inscripción y pago:', error);
//     return res.status(500).json({ success: false, message: 'Error al realizar la inscripción y pago', error });
//   }
// });





// Crear una nueva inscripción y su respectivo pago
router.post('/create', async (req, res) => {
  try {
    const {
      costoTarifa, codTalleres, codCliente, codHorario, metodoPago,
      importePago, venta_id, tiempo, clases, email, dias, horario,
      nombres, apellidos, genero, fecha_nacimiento, condicion
    } = req.body;


    // Verificar la cantidad de vacantes disponibles
    const vacantesDisponibles = await Horarios.getVacantes(codHorario);

    if (vacantesDisponibles === 0) {
      return res.status(400).json({ success: false, message: 'No hay vacantes disponibles para este horario' });
    }

    // Disminuir 1 vacante en el horario seleccionado
    const updatedVacantes = await Horarios.updateVacantes(codHorario);
    if (updatedVacantes === 0) {
      return res.status(400).json({ success: false, message: 'No se pudo reducir vacantes.' });
    }

    // Insertar la inscripción en la tabla Inscripciones
    const inscripcionData = {
      fechaInscripcion: moment().format('YYYY-MM-DD HH:mm:ss'),
      costoTarifa,
      codTalleres,
      codCliente,
      codUsuario: 5, // Usuario por defecto
      codHorario,
      tiempo,
      clases,
      email,
      dias,
      horario
    };
    const codInscripcion = await Inscripciones.create(inscripcionData);

    // Insertar el registro en la tabla Alumnos
    const alumnoData = {
      codCliente, // El cliente asociado
      codInscripcion, // Vincular el alumno con la inscripción creada
      nombres,
      apellidos,
      genero,
      fecha_nacimiento,
      condicion
    };

    await Alumnos.create(alumnoData);

    // Insertar el pago en la tabla Pagos
    const pagoData = {
      fechaPago: moment().format('YYYY-MM-DD HH:mm:ss'),
      metodoPago,
      importePago,
      venta_id,
      codInscripcion
    };
    await Pagos.create(pagoData);

    return res.status(201).json({ success: true, message: 'Inscripción, alumno y pago realizados correctamente', codInscripcion });
  } catch (error) {
    console.error('Error en la inscripción, alumno y pago:', error);
    return res.status(500).json({ success: false, message: 'Error al realizar la inscripción, alumno y pago', error });
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
      { header: 'Nombre Completo Cliente', key: 'nombreCompleto', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email Cliente', key: 'emailCliente', width: 30 },
      { header: 'Documento', key: 'numDocumento', width: 15 },
      { header: 'Tipo Cliente', key: 'tipoCliente', width: 20 }
    ];

    // Añadir estilos a la cabecera
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1872A1' } // Azul para la cabecera
      };
    });

    // Añadir los datos al archivo Excel y aplicar estilos según el nombre del taller
    data.forEach((inscripcion) => {
      const row = worksheet.addRow({
        codInscripcion: inscripcion.codInscripcion,
        nombreTaller: inscripcion.nombreTaller,
        dias: inscripcion.dias,
        horario: inscripcion.horario,
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
        nombreCompleto: `${inscripcion.nombres} ${inscripcion.primer_apellido} ${inscripcion.segundo_apellido}`,
        telefono: inscripcion.telefono,
        emailCliente: inscripcion.emailCliente,
        numDocumento: inscripcion.numDocumento,
        tipoCliente: inscripcion.tipoCliente
      });

      // Aplicar color de fondo a las filas según la categoría del taller
      let bgColor;
      switch (inscripcion.nombreTaller) {
        case 'Natación':
          bgColor = 'B9D6EC'; // Celeste para Natación
          break;
        case 'Voley':
          bgColor = 'E0CAF0'; // Melón para Voley
          break;
        case 'Básquet':
          bgColor = 'ECD6B9'; // Naranja para Básquet
          break;
        case 'Fútbol':
          bgColor = 'C2E296'; // Verde para Fútbol
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

      // Si el importe de pago es menor que el costo de la tarifa, poner el texto en rojo
      if (parseFloat(inscripcion.importePago) < parseFloat(inscripcion.costoTarifa)) {
        row.getCell('importePago').font = { color: { argb: 'FF0000' } }; // Rojo para importePago menor que costoTarifa
      }
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
