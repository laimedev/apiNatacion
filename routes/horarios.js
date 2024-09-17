const express = require('express');
const router = express.Router();
const Horarios = require('../models/Horarios');
const ExcelJS = require('exceljs');
const { check, validationResult } = require('express-validator');

// Crear un nuevo horario
router.post('/create', [
  check('dias').notEmpty().withMessage('El campo "días" es requerido'),
  check('hora_inicio').notEmpty().withMessage('El campo "hora_inicio" es requerido'),
  check('hora_fin').notEmpty().withMessage('El campo "hora_fin" es requerido'),
  check('precio').notEmpty().withMessage('El campo "precio" es requerido'),
  check('sesiones').notEmpty().withMessage('El campo "sesiones" es requerido'),
  check('vacantes').notEmpty().withMessage('El campo "vacantes" es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const formData = {
      ...req.body,
      estado: 'ACTIVO', // Estado inicial
      creacion: new Date().toISOString()
    };

    const horarioId = await Horarios.create(formData);
    res.status(201).json({ success: 'Horario creado exitosamente', horarioId });
  } catch (error) {
    console.error('Error al crear el horario:', error);
    res.status(500).json({ error: 'Error al crear el horario' });
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

    // Actualizar el horario
    await Horarios.update(codHorario, formData);
    res.status(200).json({ success: 'Horario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el horario:', error);
    res.status(500).json({ error: 'Error al actualizar el horario' });
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
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { horarios, total } = await Horarios.getHorarios(page, limit, search, status, startDate, endDate);
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
router.post('/export-excel', async (req, res) => {
    try {
      const data = await Horarios.exportData();
  
      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Horarios');
  
      // Encabezados de las columnas
      worksheet.columns = [
        { header: 'ID', key: 'codHorario', width: 10 },
        { header: 'Días', key: 'dias', width: 30 },
        { header: 'Hora Inicio', key: 'hora_inicio', width: 20 },
        { header: 'Hora Fin', key: 'hora_fin', width: 20 },
        { header: 'Precio', key: 'precio', width: 15 },
        { header: 'Sesiones', key: 'sesiones', width: 10 },
        { header: 'Vacantes', key: 'vacantes', width: 10 },
        { header: 'Instructor', key: 'codInstructor', width: 20 },
        { header: 'Taller', key: 'codTalleres', width: 20 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Fecha de Creación', key: 'creacion', width: 20 }
      ];
  
      // Añadir los datos al archivo Excel
      data.forEach((horario) => {
        worksheet.addRow({
          codHorario: horario.codHorario,
          dias: horario.dias,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          precio: horario.precio,
          sesiones: horario.sesiones,
          vacantes: horario.vacantes,
          codInstructor: horario.codInstructor,
          codTalleres: horario.codTalleres,
          estado: horario.estado,
          creacion: horario.creacion
        });
      });
  
      // Generar el archivo Excel y enviarlo como respuesta
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=horarios.xlsx');
      res.send(buffer);
  
    } catch (error) {
      console.error('Error al exportar los horarios a Excel:', error);
      return res.status(500).json({ error: 'Error al exportar los horarios a Excel' });
    }
  });



module.exports = router;