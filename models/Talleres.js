const dbConnection = require('../core/db_config');

const Talleres = {
  // Crear un nuevo taller
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Talleres SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Obtener un taller por ID
  findById: async (codTalleres) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Talleres WHERE codTalleres = ?';
      const [rows] = await connection.query(query, [codTalleres]);
      connection.release();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Actualizar un taller
  update: async (codTalleres, formData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Talleres SET ? WHERE codTalleres = ?';
      const result = await connection.query(query, [formData, codTalleres]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Eliminar un taller
  deleteById: async (codTalleres) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Talleres WHERE codTalleres = ?';
      await connection.query(query, [codTalleres]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  // Listar todos los talleres
  getAll: async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Talleres';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


    // Cambiar el estado de un taller
    changeStatus: async (codTalleres, estado) => {
      try {
        const connection = await dbConnection();
        const query = 'UPDATE Talleres SET estado = ? WHERE codTalleres = ?';
        const result = await connection.query(query, [estado, codTalleres]);
        connection.release();
        return result.affectedRows;
      } catch (error) {
        throw new Error(error);
      }
    },
    

    // Listar talleres con filtros de paginación, búsqueda, estado, y fechas
  getTalleres: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM Talleres WHERE 1=1';

      // Filtro de búsqueda por título o descripción
      if (search) {
        query += ` AND (titulo LIKE '%${search}%' OR descripcion LIKE '%${search}%')`;
      }

      // Filtro por estado
      if (status) {
        query += ` AND estado = '${status}'`;
      }

      // Filtro por rango de fechas (creación)
      if (startDate && endDate) {
        query += ` AND creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      // Ordenar por fecha de creación descendente
      query += ' ORDER BY creacion DESC';

      // Paginación
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.query(query);

      // Contar el total de registros (para la paginación)
      const countQuery = 'SELECT COUNT(*) AS total FROM Talleres WHERE 1=1';
      let totalQuery = countQuery;

      if (search) {
        totalQuery += ` AND (titulo LIKE '%${search}%' OR descripcion LIKE '%${search}%')`;
      }
      if (status) {
        totalQuery += ` AND estado = '${status}'`;
      }
      if (startDate && endDate) {
        totalQuery += ` AND creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      const [countRows] = await connection.query(totalQuery);
      const total = countRows[0].total;

      connection.release();
      return { talleres: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },
  
};

module.exports = Talleres;
