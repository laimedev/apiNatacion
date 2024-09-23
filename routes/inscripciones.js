const express = require('express');
const router = express.Router();
const moment = require('moment');
const Inscripciones = require('../models/Inscripciones');
const Pagos = require('../models/Pagos');

// Crear una nueva inscripción y su respectivo pago
router.post('/create', async (req, res) => {
  try {
    const { costoTarifa, codAlumno, codTalleres,codCliente, codHorario, importePago, venta_id, tiempo, clases, email, dias, horario } = req.body;

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

  

module.exports = router;
