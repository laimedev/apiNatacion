const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const  Contacto  = require('../models/Contacto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');


router.post('/create', [
    check('nombre').notEmpty().withMessage('El nombre es requerido.'),
    check('apellido').notEmpty().withMessage('El apellido es requerido.'),
    check('email').notEmpty().withMessage('El correo electrónico es requerido.').isEmail().withMessage('El correo electrónico no es válido'),
    check('telefono').notEmpty().withMessage('La telefono es requerido.'),
    check('consulta').notEmpty().withMessage('La consulta es requerida.')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { nombre, apellido, email, telefono, consulta} = req.body;
      const formData = {
        nombre,
        apellido,
        email,
        telefono,
        consulta,
        fecha: new Date().toISOString(),
        };
        await Contacto.create(formData);
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        const templatePath = path.join(__dirname, '..', 'views', 'emailTemplate.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
        const mailOptions = {
          from: process.env.EMAIL_USERNAME,
          to: email,
          subject: 'CONTACTO SURCO DEPORTES',
          html: htmlTemplate.replace(/\$\{formData\.nombre\}/g, formData.nombre)
          .replace(/\$\{formData\.apellido\}/g, formData.apellido)
          .replace(/\$\{formData\.email\}/g, formData.email)
          .replace(/\$\{formData\.telefono\}/g, formData.telefono)
          .replace(/\$\{formData\.consulta\}/g, formData.consulta)
          .replace(/\$\{process\.env\.COMPANY\}/g, `${process.env.COMPANY}`)
          .replace(/\$\{process\.env\.LOGO\}/g, `${process.env.LOGO}`)
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            return res.status(200).json({ message: 'Error al enviar el correo', reps: false });
          }
          return res.status(200).json({ success: 'Consulta registrada exitosamente, fue enviado un correo electronico.',
            nombre: formData.nombre,
            apellido: formData.apellido,
            consulta: formData.consulta,
          });
        });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error en el registro' });
    }
  });



  router.get('/list', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const records = parseInt(req.query.records) || 10;
      const searchTerm = req.query.searchTerm || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
      const { rows, total } = await Contacto.getTableList(page, records, searchTerm, startDate, endDate);
      return res.status(200).json({ data: rows, total });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener la lista' });
    }
  });



  router.get('/:codContacto', async (req, res) => {
    const codContacto = req.params.codContacto;
    try {
      const user = await Contacto.getById(codContacto);
      if (!user) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al obtener el registro' });
    }
  });



  router.delete('/delete/:codContacto', async (req, res) => {
    const idContacto = req.params.codContacto;
    try {
      await Contacto.deleteById(idContacto);
      return res.status(200).json({ success: 'Eliminado correctamente' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al eliminar' });
    }
  });



  
router.post('/export-excel', async (req, res) => {
    try {
        const data = await Contacto.exportData();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contactos');
        worksheet.getRow(1).font = { bold: true };
        worksheet.columns = [
            { header: 'ID', key: 'codContacto', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Apellido', key: 'apellido', width: 30 },
            { header: 'Telefono', key: 'telefono', width: 30 },
            { header: 'Correo electrónico', key: 'email', width: 30 },
            { header: 'Consulta', key: 'consulta', width: 30 },
            { header: 'Fecha registro', key: 'fecha', width: 30 },
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
        data.forEach((form, index) => {
            worksheet.addRow({
            codContacto: form.codContacto,
            nombre: form.nombre,
            apellido: form.apellido,
            telefono: form.telefono,
            email: form.email,
            consulta: form.consulta,
            fecha: form.fecha,
            });
        });
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=contactos.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al exportar Excel' });
    }
  });

  
module.exports = router;