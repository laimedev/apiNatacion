//const express = require('express');
//const router = express.Router();
//const db = require('../core/db_config'); // Importa el módulo para acceder a la base de datos
//const moment = require('moment');
//
//router.get('/listar/', (req, res) => {
//  const id = req.query.id;
//  const sql = `
//    SELECT * FROM localidad`;
//
//  db.query(sql, (error, rows) => {
//    if (error) {
//      console.error(error);
//      res.status(500).json({ error: 'Error en el servidor' });
//    } else {
//      res.json(rows); // Enviar las filas obtenidas en la respuesta JSON
//    }
//  });
//});
//module.exports = router;




const express = require('express');
const router = express.Router();
const dbConnection = require('../core/db_config'); // Importa la función para obtener la conexión a la base de datos
const moment = require('moment');

router.get('/listar/', async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const sql = `SELECT * FROM localidad`;

    const [rows] = await connection.execute(sql); // Ejecuta la consulta utilizando la conexión

    res.json(rows); // Enviar las filas obtenidas en la respuesta JSON

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;