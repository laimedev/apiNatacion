const dbConnection = require('../core/db_config');
const bcrypt = require('bcrypt');

const Clientes = {
  create: async (formData) => {
    try {
      const connection = await dbConnection(); // Obtener la conexión
      const query = 'INSERT INTO Clientes SET ?'; // Consulta SQL para insertar el registro
      const [result] = await connection.query(query, formData); // Ejecutar la consulta
      connection.release(); // Liberar la conexión a la base de datos
      return result.insertId; // Retornar el ID del nuevo registro
    } catch (error) {
      console.error('Error al crear alumno en la base de datos:', error);
      throw new Error('Error al crear alumno');
    }
  },

    findOneByEmailOrDocumento: async (identifier) => {
      try {
        const connection = await dbConnection();
        const query = 'SELECT * FROM Clientes WHERE email = ? OR numDocumento = ?';
        const [results] = await connection.query(query, [identifier, identifier]);
        connection.release();
        return results.length > 0 ? results[0] : null;
      } catch (error) {
        throw new Error('Error al buscar cliente por email o documento: ' + error);
      }
    },

  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Clientes WHERE ?';
      const [results] = await connection.query(query, conditions);
      connection.release();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },

  updateUser: async (codCliente, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Clientes SET ? WHERE codCliente = ?';
      const result = await connection.query(query, [updatedData, codCliente]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  changeStatus: async (codCliente, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Clientes SET ? WHERE codCliente = ?';
      const result = await connection.query(query, [updatedUserData, codCliente]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },


  deleteById: async (codCliente) => {
    try {
      const connection = await dbConnection();

      // Verificar si el cliente existe
      const [rows] = await connection.query('SELECT * FROM Clientes WHERE codCliente = ?', [codCliente]);
      
      if (rows.length === 0) {
        // Cliente no encontrado
        connection.release();
        return { success: false, message: 'Cliente no encontrado' };
      }

      // Si el cliente existe, proceder a eliminar
      const deleteQuery = 'DELETE FROM Clientes WHERE codCliente = ?';
      await connection.query(deleteQuery, [codCliente]);
      
      connection.release();
      return { success: true, message: 'Cliente eliminado correctamente' };
    } catch (error) {
      throw new Error('Error al eliminar cliente: ' + error.message);
    }
  },

  getAllClients: async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Clientes';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


  exportData: async () => {
    try {
      const connection = await dbConnection();
      const query = `SELECT codCliente, nombres, primer_apellido, segundo_apellido, genero, tipoDocumento, numDocumento, telefono, email, estado, tipo, creacion
                     FROM Clientes`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


  findById: async (codCliente) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Clientes WHERE codCliente = ?';
      const [rows] = await connection.query(query, [codCliente]);
      connection.release();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },


  update: async (codCliente, formData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Clientes SET ? WHERE codCliente = ?';
      const result = await connection.query(query, [formData, codCliente]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },



  updatePassword: async (codCliente, newPassword) => {
    const connection = await dbConnection();
    const query = 'UPDATE Clientes SET password = ? WHERE codCliente = ?';
    await connection.query(query, [newPassword, codCliente]);
    await connection.end();
  },
  



  getClients: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM Clientes WHERE 1=1';

      // Filtro de búsqueda por nombre, apellido, email, etc.
      if (search) {
        query += ` AND (
          nombres LIKE '%${search}%' OR
          primer_apellido LIKE '%${search}%' OR
          segundo_apellido LIKE '%${search}%' OR
          email LIKE '%${search}%' OR
          numDocumento LIKE '%${search}%'
        )`;
      }

      // Filtro por estado
      if (status) {
        query += ` AND estado = '${status}'`;
      }

      // Filtro por rango de fechas
      if (startDate && endDate) {
        query += ` AND creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      // Ordenar por fecha de creación descendente
      query += ' ORDER BY creacion DESC';

      // Paginación
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.query(query);
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM Clientes WHERE 1=1';

      // Agregar filtros al conteo total
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
      return { clients: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  }
};
module.exports = Clientes;