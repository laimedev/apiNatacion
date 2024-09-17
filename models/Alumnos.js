const dbConnection = require('../core/db_config');

const Alumnos = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Alumnos SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  findByClientId: async (codCliente) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Alumnos WHERE codCliente = ?';
      const [results] = await connection.query(query, [codCliente]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(error);
    }
  },

  updateStudent: async (codAlumno, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Alumnos SET ? WHERE codAlumno = ?';
      const result = await connection.query(query, [updatedData, codAlumno]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  deleteById: async (codAlumno) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Alumnos WHERE codAlumno = ?';
      await connection.query(query, [codAlumno]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  }
};

module.exports = Alumnos;