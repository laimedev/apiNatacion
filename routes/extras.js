const express = require('express');
const router = express.Router();
const moment = require('moment');
const Extras = require('../models/Extras');





// Ruta para calcular el precio basado en el tipo de cliente y la disponibilidad de vacantes
router.get('/calculate-price', async (req, res) => {
    try {
      const { codCliente, codHorario } = req.query;
  
      // Validar que los parámetros están presentes
      if (!codCliente || !codHorario) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros codCliente o codHorario' });
      }
  
      // Obtener el precio y la información del horario
      const result = await Extras.getPriceByClientAndHorario(codCliente, codHorario);
  
      // Si no hay vacantes disponibles, retornar un mensaje de error
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
  
      // Retornar la información del horario y el precio calculado
      return res.status(200).json({ success: true, data: result.horario });
    } catch (error) {
      console.error('Error al calcular el precio:', error);
      return res.status(500).json({ success: false, message: 'Error al calcular el precio', error: error.message });
    }
  });




module.exports = router;
