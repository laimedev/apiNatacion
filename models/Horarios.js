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

      // Consulta SQL con JOIN entre Horarios y Talleres para obtener el nombre del taller
      let query = `
        SELECT 
          h.codHorario,
          h.dias,
          h.horario, -- El campo que contiene el JSON string
          h.tiempo,
          h.precio,
          h.precioSurcano,
          h.sesiones,
          h.vacantes,
          h.codInstructor,
          h.codTalleres,
          t.titulo AS nombreTaller -- Aquí se incluye el título del taller
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        WHERE 1=1`;

      // Filtro de búsqueda por días, codTalleres o codInstructor
      if (search) {
        query += ` AND (h.dias LIKE '%${search}%' OR h.codTalleres LIKE '%${search}%' OR h.codInstructor LIKE '%${search}%')`;
      }

      // Filtro por estado
      if (status) {
        query += ` AND h.estado = '${status}'`;
      }

      // Filtro por rango de fechas (creación)
      if (startDate && endDate) {
        query += ` AND h.creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      // Ordenar por fecha de creación descendente
      query += ' ORDER BY h.creacion DESC';

      // Paginación
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.query(query);

      // Convertir el campo "horario" de string a JSON array para cada fila
      const horarios = rows.map(row => {
        if (row.horario) {
          try {
            row.horario = JSON.parse(row.horario); // Convertir el string a JSON array
          } catch (error) {
            console.error('Error al parsear el campo horario a JSON:', error);
          }
        }
        return row;
      });

      // Contar el total de registros (para la paginación)
      let totalQuery = `
        SELECT COUNT(*) AS total
        FROM Horarios h
        LEFT JOIN Talleres t ON h.codTalleres = t.codTalleres
        WHERE 1=1`;

      if (search) {
        totalQuery += ` AND (h.dias LIKE '%${search}%' OR h.codTalleres LIKE '%${search}%' OR h.codInstructor LIKE '%${search}%')`;
      }
      if (status) {
        totalQuery += ` AND h.estado = '${status}'`;
      }
      if (startDate && endDate) {
        totalQuery += ` AND h.creacion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      const [countRows] = await connection.query(totalQuery);
      const total = countRows[0].total;

      connection.release();

      return { horarios, total };
    } catch (error) {
      throw new Error('Error al obtener horarios: ' + error.message);
    }
  },


  getByTallerId: async (codTalleres) => {
    try {
      const connection = await dbConnection();
      const query = `
        SELECT 
          h.codHorario,
          h.codTalleres,
          h.dias,
          h.horario,
          h.tiempo,
          h.precio,
          h.precioSurcano,
          h.sesiones,
          h.vacantes,
          h.estado,
          t.estado AS estadoTaller
        FROM 
          Horarios h
        INNER JOIN
          Talleres t ON h.codTalleres = t.codTalleres
        WHERE 
          h.codTalleres = ?
          AND h.estado = 'ACTIVO'
          AND t.estado = 'ACTIVO'`;
      
      const [rows] = await connection.query(query, [codTalleres]);
      connection.release();

      // Parsear el campo "horario" a JSON para cada fila si es necesario
      const horarios = rows.map(row => {
        if (row.horario) {
          row.horario = JSON.parse(row.horario);
        }
        return row;
      });

      return horarios;
    } catch (error) {
      throw new Error('Error al obtener horarios: ' + error);
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
