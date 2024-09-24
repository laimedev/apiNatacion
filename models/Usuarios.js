const dbConnection = require('../core/db_config');
const bcrypt = require('bcrypt');

const Usuarios = {
  // Crear un nuevo usuario
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Usuarios SET ?';
      const [result] = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new Error('Error al crear usuario');
    }
  },

  // Obtener un usuario por condiciones
  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Usuarios WHERE ?';
      const [results] = await connection.query(query, conditions);
      connection.release();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Actualizar un usuario
  updateUser: async (codUsuario, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Usuarios SET ? WHERE codUsuario = ?';
      const result = await connection.query(query, [updatedData, codUsuario]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Cambiar el estado de un usuario
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

  // Eliminar un usuario por ID
  deleteById: async (codUsuario) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Usuarios WHERE codUsuario = ?';
      await connection.query(query, [codUsuario]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  // Exportar usuarios a Excel
  exportData: async () => {
    try {
      const connection = await dbConnection();
      const query = `SELECT codUsuario, nombres, primer_apellido, segundo_apellido, tipo, numDocumento, telefono, email, estado, creacion
                     FROM Usuarios`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Obtener un usuario por ID
  findById: async (codUsuario) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Usuarios WHERE codUsuario = ?';
      const [rows] = await connection.query(query, [codUsuario]);
      connection.release();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Listar usuarios con filtros
  getUsers: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM Usuarios WHERE 1=1';

      if (search) {
        query += ` AND (
          nombres LIKE '%${search}%' OR
          primer_apellido LIKE '%${search}%' OR
          segundo_apellido LIKE '%${search}%' OR
          email LIKE '%${search}%' OR
          numDocumento LIKE '%${search}%'
        )`;
      }

      if (status) {
        query += ` AND estado = '${status}'`;
      }

      if (startDate && endDate) {
        query += ` AND creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      query += ' ORDER BY creacion DESC';
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.query(query);
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM Usuarios WHERE 1=1';

      let totalCount = totalCountQuery;
      if (search) {
        totalCount += ` AND (
          nombres LIKE '%${search}%' OR
          primer_apellido LIKE '%${search}%' OR
          segundo_apellido LIKE '%${search}%' OR
          email LIKE '%${search}%' OR
          numDocumento LIKE '%${search}%'
        )`;
      }
      if (status) {
        totalCount += ` AND estado = '${status}'`;
      }
      if (startDate && endDate) {
        totalCount += ` AND creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      const [totalCountRows] = await connection.query(totalCount);
      const total = totalCountRows[0].total;

      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },


  findOneByEmailOrDocumento: async (identifier) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Usuarios WHERE email = ? OR numDocumento = ?';
      const [results] = await connection.query(query, [identifier, identifier]);
      connection.release();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error('Error al buscar usuario por email o documento: ' + error);
    }
  },


  
};

module.exports = Usuarios;
