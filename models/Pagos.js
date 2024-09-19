const dbConnection = require('../core/db_config');

const Pagos = {
  create: async (pagoData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Pagos SET ?';
      const [result] = await connection.query(query, pagoData);
      connection.release();
      return result.insertId; // Retorna el ID del pago creado
    } catch (error) {
      throw new Error('Error al crear pago: ' + error);
    }
  }
};

module.exports = Pagos;
