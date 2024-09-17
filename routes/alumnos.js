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

module.exports = router;