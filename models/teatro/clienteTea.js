const dbConnection = require('../../core/db_config');

const ClienteTea = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO clientesTemuss SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },


  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM clientesTemuss WHERE ?';
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

  findOneDni:async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM clientesTemuss WHERE ?';
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


  updateTokenAndCode: async (codCliente, token, code) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE clientesTemuss SET remember_token = ?, verify_code = ? WHERE codCliente = ?';
      await connection.query(query, [token, code, codCliente]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },


  updateToken: async (codCliente, token) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE clientesTemuss SET remember_token = ? WHERE codCliente = ?';
      await connection.query(query, [token, codCliente]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  updatePassword: async (usuarioId, hashedPassword) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE clientesTemuss SET password = ? WHERE codCliente = ?';
      await connection.query(query, [hashedPassword, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  updateUser: async (codCliente, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE clientesTemuss SET ? WHERE codCliente = ?';
      const result = await connection.query(query, [updatedUserData, codCliente]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },



  getUsers: async (page = 1, limit = 10, search = '', estado, startDate, endDate) => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM clientesTemuss';
      if (search) {
        query += ` WHERE 
          nombres LIKE '%${search}%' OR
          num_documento LIKE '%${search}%' OR
          email LIKE '%${search}%'`; 
      }

      if (estado) {
        if (search) {
          query += ' AND';
        } else {
          query += ' WHERE'; 
        }
        query += ` estado = '${estado}'`;
      }
       if (startDate && endDate) {
        if (search || estado) {
          query += ' AND'; 
        } else {
          query += ' WHERE'; 
        }
        query += ` creacion BETWEEN '${startDate}' AND '${endDate}'`; 
      }
      query += ' ORDER BY creacion DESC';
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.query(query);
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM clientesTemuss';
      const [countRows] = await connection.query(totalCountQuery);
      const total = countRows[0].total;
      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },


  getUserById: async (codCliente) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM clientesTemuss WHERE codCliente = ?';
      const [rows] = await connection.query(query, [codCliente]);
      connection.release();
      if (rows.length === 0) {
        return null; 
      }
      return rows[0];
    } catch (error) {
      throw new Error(error);
    }
  },


  changeStatus: async (codCliente, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE clientesTemuss SET ? WHERE codCliente = ?';
      const result = await connection.query(query, [updatedUserData, codCliente]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },


  deleteUserById: async (userId) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM clientesTemuss WHERE codCliente = ?';
      await connection.query(query, [userId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },


  getAllUsers:  async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT codCliente, tipo, num_documento,  nombres, primer_apellido, segundo_apellido, telefono, email, creacion  FROM clientesTemuss';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


};

module.exports = ClienteTea;