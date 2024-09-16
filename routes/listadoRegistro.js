const express = require('express');
const moment = require('moment-timezone');
const Registro = require('../models/Registro');
const Localidad = require('../models/Localidad');
//const Usuario = require('../models/Usuario');
const Cliente = require('../models/Clientes');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const mytime = moment().tz('America/Lima');
    const fecha = mytime.format('YYYY-MM-DD');
    let searchText = req.query.searchText ? req.query.searchText.trim() : '';
    let searchText2 = req.query.searchText2 ? req.query.searchText2.trim() : '';
    let searchText3 = req.query.searchText3 ? req.query.searchText3.trim() : '';


    const query = searchText ? fecha : searchText;
    const query2 = searchText2 === 'TODO' ? '' : searchText2;
    const query3 = searchText3 === 'TODO' ? '' : searchText3;

    let whereOptions = {
      fechRegistro: {
        [Op.like]: `%${query}%`,
      },
    };

//    if (req.user.tipo === 'ADMINISTRADOR') {
//      whereOptions['$Localidad.nomLocalidad$'] = {
//        [Op.like]: `%${query3}%`,
//      };
//    } else {
//whereOptions['$Localidad.codLocalidad$'] = req.user.codLocalidad;
//    }
//
    const registro = await Registro.findAll({
      where: whereOptions,
      include: [
        //{
        //  model: Usuario,
        //  attributes: ['nombres'],
        //},
        //{
        //  model: Cliente,
        //  attributes: ['nombres'],
        //},
        //{
        //  model: Localidad,
        //  attributes: ['nomLocalidad'],
        //},
      ],
      attributes: [
        'codRegistro',
        'fechRegistro',
        'horainicio',
        'horafinal',
        'estado',
        ['Localidad.nomLocalidad', 'nomLocalidad'],
        'pago',
        ['Usuario.nombres', 'nomUsuario'],
        ['Cliente.nombres', 'nomCliente'],
        'comentario',
        'imgComprobante',
        'tipo',
      ],
      order: [['fechRegistro', 'DESC'], ['horainicio', 'DESC']],
      limit: 10,
    });

    const localidad = await Localidad.findAll({
      where: {
        nomLocalidad: {
          [Op.ne]: 'TODO',
        },
      },
    });

    return res.json( {
      registro,
      fecha,
      localidad,
      searchText: query,
      searchText2: query2,
      searchText3: query3,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener los registros' });
  }
});

module.exports = router;
