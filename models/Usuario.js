
const dbConnection = require('../core/db_config');

const Usuario = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Usuarios SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  changeStatus: async (codUsuario, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Usuarios SET ? WHERE codUsuario = ?';
      const result = await connection.query(query, [updatedUserData, codUsuario]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  updateUser: async (codUsuario, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Usuarios SET ? WHERE codUsuario = ?';
      const result = await connection.query(query, [updatedUserData, codUsuario]);
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
      let query = 'SELECT * FROM Usuarios';
      if (search) {
        query += ` WHERE 
          nombres LIKE '%${search}%' OR
          numDocumento LIKE '%${search}%' OR
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
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM Usuarios';
      const [countRows] = await connection.query(totalCountQuery);
      const total = countRows[0].total;
      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },


  getAllUsers:  async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT codUsuario, tipo, numDocumento,  nombres, primer_apelllido, segundo_apellido, telefono, email, creacion  FROM Usuarios';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


    deleteUserById: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'DELETE FROM Usuarios WHERE codUsuario = ?';
        await connection.query(query, [userId]);
        connection.release();
      } catch (error) {
        throw new Error(error);
      }
    },


    getUserById: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'SELECT * FROM Usuarios WHERE codUsuario = ?';
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
      const query = 'SELECT * FROM Usuarios WHERE ?';
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


  findTokenCode: async (conditions) => {
    try {
      const connection = await dbConnection();
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);
  
      // Construir la cláusula WHERE dinámicamente
      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      const query = `SELECT * FROM Usuarios WHERE ${whereClause}`;
      
      const [results] = await connection.query(query, values);
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
  
  findOne2: async (field, value) => {
    try {
      const connection = await dbConnection();
      const query = `SELECT * FROM Usuarios WHERE ${field} = ?`;
      const [results] = await connection.query(query, [value]);
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
      const query = 'UPDATE Usuarios SET remember_token = ? WHERE codUsuario = ?';
      await connection.query(query, [token, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },


  updateTokenAndCode: async (usuarioId, token, code) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Usuarios SET remember_token = ?, verify_code = ? WHERE codUsuario = ?';
      await connection.query(query, [token, code, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },


  updatePassword: async (usuarioId, hashedPassword) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Usuarios SET password = ? WHERE codUsuario = ?';
      await connection.query(query, [hashedPassword, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  findOneDni:async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Usuarios WHERE ?';
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

module.exports = Usuario;