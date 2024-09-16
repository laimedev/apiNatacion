const db = require('../core/db_config'); // Importa el objeto de conexión a la base de datos

class Registro {
  static async findAll(options) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.codRegistro,
          r.fechRegistro,
          r.horainicio,
          r.horafinal,
          r.estado,
          l.nomLocalidad AS nomLocalidad,
          u.nombres AS nomUsuario,
          c.nombres AS nomCliente,
          r.comentario,
          r.imgComprobante,
          r.tipo
        FROM
          registro AS r
          JOIN usuario AS u ON r.codUsuario = u.codUsuario
          JOIN cliente AS c ON r.codCliente = c.codCliente
          JOIN localidad AS l ON r.codLocalidad = l.codLocalidad
        WHERE
          r.fechRegistro LIKE ?
          AND (
            c.nombres LIKE ?
            OR r.horainicio LIKE ?
            OR r.horafinal LIKE ?
            OR r.tipo LIKE ?
            OR r.estado LIKE ?
          )
          ${options.isAdmin ? "AND l.nomLocalidad LIKE ?" : "AND l.codLocalidad = ?"}
        ORDER BY
          r.fechRegistro DESC,
          r.horainicio DESC
        LIMIT
          10
      `;

      const values = [
        `%${options.query}%`,
        `%${options.query2}%`,
        `%${options.query2}%`,
        `%${options.query2}%`,
        `%${options.query2}%`,
        `%${options.query2}%`,
        `%${options.query3}%`,
      ];

      db.query(query, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = Registro;
