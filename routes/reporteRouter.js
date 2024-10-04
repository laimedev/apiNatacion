const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const  Reportes  = require('../models/Reportes'); // Asumiendo que tienes un modelo llamado Admin
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');



router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const records = parseInt(req.query.records) || 10;
    const searchTerm = req.query.searchTerm || '';
    const venta_id = req.query.venta_id || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const { data, total } = await Reportes.getReservas(page, records, searchTerm, venta_id ,status, startDate, endDate);
    return res.status(200).json({ data: data, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener la lista de reservas 123' });
  }
});



router.get('/export-excel', async (req, res) => {
  try {

    const searchTerm = req.query.searchTerm || '';
    const venta_id = req.query.venta_id || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';


    const reportes = await Reportes.getAllReservas(searchTerm, venta_id ,status, startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reservas');
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [
      { header: 'ID', key: 'codRegistro', width: 8 },
      { header: 'Nombre', key: 'nomCliente', width: 20 },
      { header: '1º Apellido', key: 'primer_apellido', width: 15 },
      { header: '2º Apellido', key: 'segundo_apellido', width: 15 },
      { header: 'Documento', key: 'numDocumento', width: 12 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Creacion', key: 'fechRegistro', width: 12 },
      { header: 'Hora inicio', key: 'horainicio', width: 10 },
      { header: 'Hora fin', key: 'horafinal', width: 10 },
      { header: 'Duracion', key: 'duracion', width: 10 },
      { header: 'Tarifa', key: 'costoTarifa', width: 10 },
      { header: 'Estado', key: 'estadoRegistro', width: 15 },
      { header: 'Campo', key: 'nomLocalidad', width: 20 },

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
    reportes.forEach((reporte, index) => {

      // Verifica el estado de registro y asigna el color correspondiente
      if (reporte.estadoRegistro === 'CONFIRMADO') {
        fillColor = { argb: 'FF00FF00' }; // Verde para confirmado
      } else if (reporte.estadoRegistro === 'SIN CONFIRMAR') {
        fillColor = { argb: 'E64032' }; // Rojo para no confirmado
      }

      worksheet.addRow({
        codRegistro: reporte.codRegistro,
        nomCliente: reporte.nomCliente,
        primer_apellido: reporte.primer_apellido,
        segundo_apellido: reporte.segundo_apellido,
        numDocumento: reporte.numDocumento,
        tipo: reporte.tipo,
        fechRegistro: reporte.fechRegistro,
        horainicio: reporte.horainicio,
        horafinal: reporte.horafinal,
        duracion: reporte.duracion,
        costoTarifa: reporte.costoTarifa,
        estadoRegistro: reporte.estadoRegistro,
        nomLocalidad: reporte.nomLocalidad,
      })
      const estadoRegistroCell = worksheet.getCell(`L${index + 2}`); // 'L' es la columna de estadoRegistro
      estadoRegistroCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: fillColor,
      };

    });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reportes.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los reportes a Excel' });
  }
});



router.delete('/delete/:venta_id', async (req, res) => {
  const userId = req.params.venta_id;
  try {
    // Eliminar el usuario por su ID utilizando la función deleteUserById del modelo
    await Reportes.deleteByVentaId(userId);

    return res.status(200).json({ success: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar el registro' });
  }
});




router.post('/export-pdf', async (req, res) => {
  try {
    const reportes = await Reportes.getAllReservas();

    // Crear un nuevo documento PDF con tamaño de página A4 horizontal
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const buffers = [];
    const writableStream = doc.pipe(new Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk);
        callback();
      },
    }));

    // Establecer el tamaño de fuente en 10 puntos
    doc.fontSize(10);

    // Establecer el título del documento
    doc.text('Reporte de Reservas', { align: 'center' });

    // Mover el cursor a una posición más baja en la página antes de dibujar la tabla
    doc.moveDown();

    // Crear la tabla
    const table = {
      headers: ['ID', 'Nombre', '1º Apellido', '2º Apellido', 'Documento', 'Tipo', 'Creacion', 'Hora inicio', 'Hora fin', 'Duracion', 'Tarifa', 'Estado', 'Campos'],
      rows: [],
    };

    // Llenar la tabla con los datos de reportes
    reportes.forEach(reporte => {
      const row = [
        reporte.codRegistro,
        reporte.nomCliente.split(' ')[0], // Tomar solo el primer nombre
        reporte.primer_apellido,
        reporte.segundo_apellido,
        reporte.numDocumento,
        reporte.tipo,
        new Date(reporte.fechRegistro).toLocaleDateString('es-ES'), // Formatear fecha a "día mes año"
        reporte.horainicio,
        reporte.horafinal,
        reporte.duracion,
        reporte.costoTarifa,
        reporte.estadoRegistro,
        reporte.nomLocalidad,
      ];
      table.rows.push(row);
    });

    // Calcular el ancho de las columnas y establecer el margen
    const columnWidth = (750 - 40) / table.headers.length; // Restamos 40 para el margen
    const margin = 20;

    // Dibujar la tabla en el documento PDF
    doc.font('Helvetica');
    table.rows.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        // Calcular las coordenadas X e Y con margen
        const x = margin + cellIndex * columnWidth;
        const y = margin + rowIndex * 20; // El espacio entre filas es de 20 puntos

        // Dibujar celda con margen
        doc.text(cell.toString(), x, y, { width: columnWidth, align: 'center' });
      });
    });

    doc.end();

    // Esperar a que el documento PDF esté completamente escrito
    writableStream.on('finish', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reportes.pdf');
      res.send(pdfBuffer);
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al exportar los reportes a PDF' });
  }
});





router.post('/search-reserva',  async (req, res) => {
  const { codLocalidad, fechRegistro, horainicio } = req.body;

  // Verificar si todos los parámetros están presentes
  if (!codLocalidad || !fechRegistro || !horainicio) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros requeridos' });
  }

  try {
    const registro = await Reportes.getReservaSearch(codLocalidad, fechRegistro, horainicio);
    if (!registro) {
      return res.status(200).json({ ok: false, error: 'Registro no encontrado' });
    }
    return res.status(200).json({ ok: true, registro });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Error al obtener el registro' });
  }
});


  router.post('/search-reserva-id',  async (req, res) => {
    const { codRegistro } = req.body;

    // Verificar si todos los parámetros están presentes
    // if (!codRegistro) {
    //   return res.status(400).json({ ok: false, error: 'Faltan parámetros requeridos' });
    // }

    try {
      const registro = await Reportes.getReservaSearchByID(codRegistro);
      if (!registro) {
        return res.status(200).json({ ok: false, error: 'Registro no encontrado' });
      }
      return res.status(200).json({ ok: true, registro });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: 'Error al obtener el registro' });
    }
  });



module.exports = router;