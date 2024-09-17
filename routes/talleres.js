const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Talleres = require('../models/Talleres');
const { check, validationResult } = require('express-validator');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Crear un nuevo taller
router.post('/create', [
  check('titulo').notEmpty().withMessage('El título es requerido'),
  check('descripcion').notEmpty().withMessage('La descripción es requerida')
], async (req, res) => {
  try {
    // Validar los campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { titulo, descripcion } = req.body;
    let formData = {
      titulo,
      descripcion,
      creacion: new Date().toISOString(),
      estado: 'INACTIVO'  // Estado inicial
    };

    // Subir la foto a Cloudinary si se proporciona
    if (req.files && req.files.foto) {
      const fotoPath = req.files.foto.tempFilePath;
      const cloudinaryResponse = await cloudinary.uploader.upload(fotoPath, {
        folder: "talleres/images",
        public_id: `${Date.now()}`
      });
      formData.foto = cloudinaryResponse.secure_url;
    }

    const tallerId = await Talleres.create(formData);
    res.status(201).json({ success: 'Taller creado exitosamente', tallerId });

  } catch (error) {
    console.error('Error en la creación del taller:', error);
    return res.status(500).json({ error: 'Error al crear el taller' });
  }
});


// Ruta para listar talleres con filtros de paginación, búsqueda, estado, y fechas
router.get('/list', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const status = req.query.status || '';
      const startDate = req.query.startDate || '';
      const endDate = req.query.endDate || '';
  
      const { talleres, total } = await Talleres.getTalleres(page, limit, search, status, startDate, endDate);
  
      res.status(200).json({ data: talleres, total });
    } catch (error) {
      console.error('Error al listar los talleres:', error);
      return res.status(500).json({ error: 'Error al listar los talleres' });
    }
  });


  
// Obtener un taller por ID
router.get('/:codTalleres', async (req, res) => {
  try {
    const taller = await Talleres.findById(req.params.codTalleres);
    if (!taller) {
      return res.status(404).json({ error: 'Taller no encontrado' });
    }
    res.status(200).json(taller);
  } catch (error) {
    console.error('Error al obtener el taller:', error);
    return res.status(500).json({ error: 'Error al obtener el taller' });
  }
});

// Actualizar un taller
router.post('/update/:codTalleres', [
  check('titulo').optional().notEmpty().withMessage('El título no puede estar vacío'),
  check('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía')
], async (req, res) => {
  try {
    const codTalleres = req.params.codTalleres;
    const { titulo, descripcion } = req.body;

    // Obtener el taller actual
    const currentTaller = await Talleres.findById(codTalleres);
    if (!currentTaller) {
      return res.status(404).json({ error: 'Taller no encontrado' });
    }

    let formData = {
      titulo: titulo || currentTaller.titulo,
      descripcion: descripcion || currentTaller.descripcion
    };

    // Subir una nueva foto si se proporciona
    if (req.files && req.files.foto) {
      const fotoPath = req.files.foto.tempFilePath;
      const cloudinaryResponse = await cloudinary.uploader.upload(fotoPath, {
        folder: "talleres/images",
        public_id: `${Date.now()}`
      });
      formData.foto = cloudinaryResponse.secure_url;
    } else {
      formData.foto = currentTaller.foto;  // Mantener la foto anterior si no se actualiza
    }

    // Actualizar el taller
    await Talleres.update(codTalleres, formData);
    res.status(200).json({ success: 'Taller actualizado exitosamente' });

  } catch (error) {
    console.error('Error en la actualización del taller:', error);
    return res.status(500).json({ error: 'Error al actualizar el taller' });
  }
});

// Eliminar un taller
router.delete('/delete/:codTalleres', async (req, res) => {
  try {
    const codTalleres = req.params.codTalleres;
    await Talleres.deleteById(codTalleres);
    res.status(200).json({ success: 'Taller eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el taller:', error);
    return res.status(500).json({ error: 'Error al eliminar el taller' });
  }
});


// Cambiar el estado del taller
router.post('/changeStatus/:codTalleres', [
    check('estado').isIn(['ACTIVO', 'INACTIVO']).withMessage('El estado debe ser ACTIVO o INACTIVO')
  ], async (req, res) => {
    try {
      const codTalleres = req.params.codTalleres;
      const { estado } = req.body;
  
      // Verificar si el taller existe
      const currentTaller = await Talleres.findById(codTalleres);
      if (!currentTaller) {
        return res.status(404).json({ error: 'Taller no encontrado' });
      }
  
      // Actualizar el estado del taller
      await Talleres.changeStatus(codTalleres, estado);
      return res.status(200).json({ success: `Estado del taller actualizado a ${estado}` });
  
    } catch (error) {
      console.error('Error al cambiar el estado del taller:', error);
      return res.status(500).json({ error: 'Error al cambiar el estado del taller' });
    }
  });





module.exports = router;
