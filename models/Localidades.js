
const dbConnection = require('../core/db_config');

const Localidades = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO localidad SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  changeStatus: async (codLocalidad, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET ? WHERE codLocalidad = ?';
      const result = await connection.query(query, [updatedData, codLocalidad]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },



  updateLocalidad: async (codLocalidad, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET ? WHERE codLocalidad = ?';
      const result = await connection.query(query, [updatedData, codLocalidad]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },


  getLocalidad: async (page = 1, limit = 10, search = '', estado, startDate, endDate) => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM localidad';
      
      // Añadir filtro para codSucursal si se proporciona
        if (search || estado || (startDate && endDate)) {
          query += ' WHERE';
          if (search) {
            query += ` nomLocalidad LIKE '%${search}%'`;
          }
          if (estado) {
            if (search) query += ' AND';
            query += ` estado = '${estado}'`;
          }
          if (startDate && endDate) {
            if (search || estado) query += ' AND';
            query += ` fecha BETWEEN '${startDate}' AND '${endDate}'`;
          }
        }
      
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.query(query);
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM localidad';
      const [countRows] = await connection.query(totalCountQuery);
      const total = countRows[0].total;
      connection.release();
      return { localidad: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },
  


  getAllLocalidad:  async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


    deleteById: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'DELETE FROM localidad WHERE codLocalidad = ?';
        await connection.query(query, [userId]);
        connection.release();
      } catch (error) {
        throw new Error(error);
      }
    },


    getById: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'SELECT * FROM localidad WHERE codLocalidad = ?';
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



     // Otros métodos del modelo Admin, como findAll, findById, update, delete, etc.

  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad WHERE ?';
      const [results] = await connection.query(query, conditions);
      connection.release();
      if (results.length > 0) {
        return results[0];
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error);
    }
  },
  updateToken: async (usuarioId, token) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET remember_token = ? WHERE codSucursal = ?';
      await connection.query(query, [token, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  updatePassword: async (usuarioId, hashedPassword) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET password = ? WHERE codSucursal = ?';
      await connection.query(query, [hashedPassword, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  findOneDni:async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad WHERE ?';
      const [results] = await connection.query(query, conditions);
      connection.release();
      if (results.length > 0) {
        return results[0];
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error);
    }
  }

};

module.exports = Localidades;
