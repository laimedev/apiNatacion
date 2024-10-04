const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const  Localidades  = require('../models/Localidades'); // Asumiendo que tienes un modelo llamado Admin
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

// Ruta de registro
router.post('/register', [
  check('nomLocalidad').notEmpty().withMessage('El nombre es requerido'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
        const { 
          nomLocalidad,
          codSucursal,
          precioDia,
          precioNoche,
          precioMenores,
          precioAdultosMayor,
          precioVecinosSI,
          precioVecinosVSP,
          } = req.body;
      const formData = {
        nomLocalidad,
        codSucursal,
        precioDia,
        precioNoche,
        precioMenores,
        precioAdultosMayor,
        precioVecinosSI,
        precioVecinosVSP,
      };
      await Localidades.create(formData);
      return res.status(200).json({ success: 'Registrado exitosamente.',
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el registro' });
  }
});


router.put('/edit/:codLocalidad', [
  check('nomLocalidad').notEmpty().withMessage('El nombre es requerido'),
], async (req, res) => {
  const userId = req.params.codLocalidad;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const DataToUpdate = req.body;
    await Localidades.updateLocalidad(userId, DataToUpdate);
    return res.status(200).json({ success: 'Información de localidad actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en la actualización de información de localidad' });
  }
});




router.delete('/delete/:codLocalidad', async (req, res) => {
  const userId = req.params.codLocalidad;
  try {
    await Localidades.deleteById(userId);
    return res.status(200).json({ success: 'Localidad eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar el localidad' });
  }
});


router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const records = parseInt(req.query.records) || 10;
    const searchTerm = req.query.searchTerm || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const { localidad, total } = await Localidades.getLocalidad(page, records, searchTerm, status, startDate, endDate);
    return res.status(200).json({ data: localidad, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de localidades' });
  }
});



router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const localidad = await Localidades.getById(id);
    if (!localidad) {
      return res.status(404).json({ error: 'Localidad no encontrado' });
    }
    return res.status(200).json(localidad);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener el localidad' });
  }
});


router.post('/export-excel', async (req, res) => {
  try {
    const localidades = await Localidades.getAllLocalidad();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Localidades');
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [
      { header: 'ID', key: 'codLocalidad', width: 10 },
      { header: 'Nombre', key: 'nomLocalidad', width: 30 },
      { header: 'Precio Dia', key: 'precioDia', width: 30 },
      { header: 'Precio Noche', key: 'precioNoche', width: 30 },
      { header: 'Precio Menores', key: 'precioMenores', width: 30 },
      { header: 'Precio Adulto Mayor', key: 'precioAdultosMayor', width: 30 },

      { header: 'Precio Vecinos SI', key: 'precioVecinosSI', width: 30 },
      { header: 'Precio Vecinos VSP', key: 'precioVecinosVSP', width: 30 },

    ];
    worksheet.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6495ED' }
        };
      });
    });
    localidades.forEach((localidad, index) => {
      worksheet.addRow({
        codLocalidad: localidad.codLocalidad,
        nomLocalidad: localidad.nomLocalidad,
        precioDia: localidad.precioDia,
        precioNoche: localidad.precioNoche,
        precioMenores: localidad.precioMenores,
        precioAdultosMayor: localidad.precioAdultosMayor,
        precioVecinosSI: localidad.precioVecinosSI,
        precioVecinosVSP: localidad.precioVecinosVSP,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=localidades.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los localidades a Excel' });
  }
});


module.exports = router;