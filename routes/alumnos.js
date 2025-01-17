const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Alumnos = require('../models/Alumnos');

router.post('/create', [
  check('nombres').notEmpty().withMessage('El nombre es requerido'),
  check('codCliente').notEmpty().withMessage('El código de cliente es requerido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const newStudent = req.body;
    const studentId = await Alumnos.create(newStudent);
    res.status(200).json({ success: true, studentId });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear alumno' });
  }
});

router.get('/by-client/:codCliente', async (req, res) => {
  try {
    const students = await Alumnos.findByClientId(req.params.codCliente);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

router.put('/update/:codAlumno', async (req, res) => {
  try {
    await Alumnos.updateStudent(req.params.codAlumno, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
});

router.delete('/delete/:codAlumno', async (req, res) => {
  try {
    await Alumnos.deleteById(req.params.codAlumno);
    res.json({ success: 'Alumno eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar alumno' });
  }
});


















router.get('/listInscripciones', async (req, res) => {
// const getAlumnosWithDetails = async (req, res) => {
  try {
    const data = await Alumnos.getAllWithDetails();

    // Estructurar los datos en un formato jerárquico
    const result = [];
    const alumnosMap = new Map();

    data.forEach((row) => {
      // Verificar si el alumno ya está en el mapa
      if (!alumnosMap.has(row.codAlumno)) {
        alumnosMap.set(row.codAlumno, {
          codAlumno: row.codAlumno,
          codCliente: row.codCliente,
          nombres: row.alumnoNombres,
          apellidos: row.alumnoApellidos,
          genero: row.genero,
          condicion: row.condicion,
          fecha_nacimiento: row.fecha_nacimiento,
          codInscripcion: row.codInscripcion,
          inscripcion: row.codInscripcion
            ? {
                fechaInscripcion: row.fechaInscripcion,
                costoTarifa: row.costoTarifa,
                estado: row.estado,
                tiempo: row.tiempo,
                dias: row.dias,
                horario: row.horario,
                pagos: []
              }
            : null,
          cliente: {
            nombres: row.clienteNombres,
            apellidos: row.clienteApellido,
            email: row.clienteEmail,
            telefono: row.clienteTelefono
          }
        });
      }

      const alumno = alumnosMap.get(row.codAlumno);

      // Agregar pago si existe
      if (row.codPago) {
        alumno.inscripcion.pagos.push({
          codPago: row.codPago,
          fechaPago: row.fechaPago,
          metodoPago: row.metodoPago,
          importePago: row.importePago,
          venta_id: row.venta_id
        });
      }
    });

    // Convertir el mapa en un array
    alumnosMap.forEach((value) => result.push(value));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error
    });
  }
});

module.exports = router;