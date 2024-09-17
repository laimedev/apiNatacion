const dbConnection = require('../core/db_config');

const Horarios = {
  // Crear un nuevo horario
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Horarios SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Obtener un horario por ID
  findById: async (codHorario) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Horarios WHERE codHorario = ?';
      const [rows] = await connection.query(query, [codHorario]);
      connection.release();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Actualizar un horario
  update: async (codHorario, formData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Horarios SET ? WHERE codHorario = ?';
      const result = await connection.query(query, [formData, codHorario]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Cambiar el estado de un horario
  changeStatus: async (codHorario, estado) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Horarios SET estado = ? WHERE codHorario = ?';
      const result = await connection.query(query, [estado, codHorario]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Listar horarios con filtros de paginación, búsqueda, estado, y fechas
  getHorarios: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM Horarios WHERE 1=1';

      // Filtro de búsqueda por días, codTalleres o codInstructor
      if (search) {
        query += ` AND (dias LIKE '%${search}%' OR codTalleres LIKE '%${search}%' OR codInstructor LIKE '%${search}%')`;
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
      const countQuery = 'SELECT COUNT(*) AS total FROM Horarios WHERE 1=1';
      let totalQuery = countQuery;

      if (search) {
        totalQuery += ` AND (dias LIKE '%${search}%' OR codTalleres LIKE '%${search}%' OR codInstructor LIKE '%${search}%')`;
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
      return { horarios: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },

  // Eliminar un horario
  deleteById: async (codHorario) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Horarios WHERE codHorario = ?';
      await connection.query(query, [codHorario]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },

  // Exportar horarios a Excel
  exportData: async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Horarios';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  }
};

module.exports = Horarios;
