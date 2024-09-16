
const dbConnection = require('../core/db_config');

const Contactos = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Contactos SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  getById: async (userId) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Contactos WHERE codContacto = ?';
      const [rows] = await connection.query(query, [userId]);
      connection.release();
      if (rows.length === 0) {
        return null; 
      }
      return rows[0];
    } catch (error) {
      throw new Error(error);
    }
  },

  updateData: async (codContacto, updatedFormData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Contactos SET ? WHERE codContacto = ?';
      const result = await connection.query(query, [updatedFormData, codContacto]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },
  

  deleteById: async (userId) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Contactos WHERE codContacto = ?';
      await connection.query(query, [userId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  exportData:  async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT *  FROM Contactos';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


  getTableList: async (page = 1, limit = 10, search = '',  startDate, endDate) => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM Contactos';
      if (search) {
        query += ` WHERE 
          nombre LIKE '%${search}%' OR
          apellido LIKE '%${search}%' OR
          email LIKE '%${search}%'`; 
      }
       if (startDate && endDate) {
        if (search) {
          query += ' AND'; 
        } else {
          query += ' WHERE'; 
        }
        query += ` fecha BETWEEN '${startDate}' AND '${endDate}'`; 
      }
      query += ' ORDER BY fecha DESC';
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.query(query);
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM Contactos';
      const [countRows] = await connection.query(totalCountQuery);
      const total = countRows[0].total;
      connection.release();
      return { rows: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },


  

};

module.exports = Contactos;
