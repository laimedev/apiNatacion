const db = require('../core/db_config'); // Importa el objeto de conexión a la base de datos

class Localidad {
  static async findAll(options) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          codLocalidad,
          nomLocalidad
        FROM
          localidad
        WHERE
          nomLocalidad != 'TODO'
      `;

      db.query(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = Localidad;
