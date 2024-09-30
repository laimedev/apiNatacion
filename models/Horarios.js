const dbConnection = require('../core/db_config');

const Horarios = {
  // Crear un nuevo horario
  create: async (horarioData) => {
    try {
      const connection = await dbConnection();
  
      // Verificar si el campo 'horario' es un texto plano y formatearlo a JSON si es necesario
      if (horarioData.horario && typeof horarioData.horario === 'string') {
        horarioData.horario = `[{"hora": "${horarioData.horario}"}]`;
      } else {
        // Si el campo 'horario' está vacío o no se envía, almacenarlo como un array vacío
        horarioData.horario = '[]';
      }
  
      const query = 'INSERT INTO Horarios SET ?';
      const [result] = await connection.query(query, horarioData);
      connection.release();
      return result.insertId; // Retorna el ID del horario creado
    } catch (error) {
      throw new Error('Error al crear el horario: ' + error);
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


  update: async (codHorario, formData) => {
    try {
      const connection = await dbConnection();
  
      // Verificar si el campo 'horario' es un texto plano y formatearlo a JSON si es necesario
      if (formData.horario && typeof formData.horario === 'string') {
        formData.horario = `[{"hora": "${formData.horario}"}]`;
      } else if (!formData.horario || formData.horario === "") {
        // Si el campo 'horario' está vacío, almacenarlo como un array vacío
        formData.horario = '[]';
      }
  
      const query = 'UPDATE Horarios SET ? WHERE codHorario = ?';
      await connection.query(query, [formData, codHorario]);
      connection.release();
      return true; // Retorna true si se actualiza correctamente
    } catch (error) {
      throw new Error('Error al actualizar el horario: ' + error);
    }
  },


  // Actualizar un horario
  // update: async (codHorario, formData) => {
  //   try {
  //     const connection = await dbConnection();
  //     const query = 'UPDATE Horarios SET ? WHERE codHorario = ?';
  //     const result = await connection.query(query, [formData, codHorario]);
  //     connection.release();
  //     return result.affectedRows;
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // },

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
  getHorariosNatacion: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
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
          h.edad,
          h.turno,
          h.vacantes,
          h.codInstructor,
          h.codTalleres,
          h.estado,
          t.titulo AS nombreTaller -- Aquí se incluye el título del taller
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        WHERE 1=1 AND h.codTalleres = '1'`;

      // Filtro de búsqueda por días, codTalleres o codInstructor
      if (search) {
        query += ` AND h.estado LIKE '${search}'`;
        // query += ` AND h.estado LIKE '%${search}%'`;
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
        WHERE 1=1 AND h.codTalleres = '1'`;

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



  // Listar horarios con filtros de paginación, búsqueda, estado, y fechas
  getHorariosVoley: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
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
          h.edad,
          h.turno,
          h.vacantes,
          h.codInstructor,
          h.codTalleres,
          h.estado,
          t.titulo AS nombreTaller -- Aquí se incluye el título del taller
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        WHERE 1=1 AND h.codTalleres = '2'`;

      // Filtro de búsqueda por días, codTalleres o codInstructor
      if (search) {
        query += ` AND h.estado LIKE '${search}'`;
        // query += ` AND h.estado LIKE '%${search}%'`;
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
        WHERE 1=1 AND h.codTalleres = '2'`;

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


  // Listar horarios con filtros de paginación, búsqueda, estado, y fechas
  getHorariosBasquet: async (page = 1, limit = 10, search = '', status = '', startDate = '', endDate = '') => {
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
          h.edad,
          h.turno,
          h.vacantes,
          h.codInstructor,
          h.codTalleres,
          h.estado,
          t.titulo AS nombreTaller -- Aquí se incluye el título del taller
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        WHERE 1=1 AND h.codTalleres = '3'`;

      // Filtro de búsqueda por días, codTalleres o codInstructor
      if (search) {
        query += ` AND h.estado LIKE '${search}'`;
        // query += ` AND h.estado LIKE '%${search}%'`;
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
        WHERE 1=1 AND h.codTalleres = '3'`;

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


  getByTallerId: async (codTalleres, dias, turno) => {
    try {
      const connection = await dbConnection();
  
      // Start building the query
      let query = `
        SELECT 
          h.codHorario,
          h.codTalleres,
          h.dias,
          h.horario,
          h.tiempo,
          h.precio,
          h.dias,
          h.turno,
          h.edad,
          h.turno,
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
          AND t.estado = 'ACTIVO'
      `;
  
      // Parameters array for prepared statement
      const params = [codTalleres];
  
      // Apply the 'dias' filter if provided
      if (dias) {
        query += ` AND h.dias = ?`;
        params.push(dias);
      }
  
      // Apply the 'turno' filter if provided
      if (turno) {
        query += ` AND h.turno = ?`;
        params.push(turno);
      }
  
      const [rows] = await connection.query(query, params);
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
      const query = `
        SELECT 
          h.codHorario,
          h.dias,
          h.horario,
          h.precio,
          h.precioSurcano,
          h.sesiones,
          h.vacantes,
          h.edad,
          h.turno,
          h.codInstructor,
          h.codTalleres,
          h.estado,
          h.creacion,
          t.titulo AS nombreTaller,
          CONCAT(u.nombres, ' ', u.primer_apellido, ' ', u.segundo_apellido) AS nombreInstructor
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        LEFT JOIN 
          Usuarios u ON h.codInstructor = u.codUsuario
        WHERE 
          h.estado = 'ACTIVO'
        ORDER BY 
          h.codTalleres ASC
      `;
      const [rows] = await connection.query(query);
      connection.release();
  
      // Extraer solo el primer elemento del array "horario"
      rows.forEach(row => {
        try {
          const horarioArray = JSON.parse(row.horario);
          row.horario = Array.isArray(horarioArray) && horarioArray.length > 0 ? horarioArray[0].hora : '';
        } catch (error) {
          row.horario = ''; // Si falla el parseo, se establece como un string vacío
        }
      });
  
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },
  
  



  // Modelo de Horarios
updateVacantes: async (codHorario) => {
  try {
    const connection = await dbConnection();
    // Disminuir el número de vacantes en 1 para el codHorario dado
    const query = 'UPDATE Horarios SET vacantes = vacantes - 1 WHERE codHorario = ? AND vacantes > 0';
    const [result] = await connection.query(query, [codHorario]);
    connection.release();
    return result.affectedRows; // Retorna el número de filas afectadas
  } catch (error) {
    throw new Error('Error al actualizar vacantes: ' + error);
  }
},



// Obtener la cantidad de vacantes de un horario
getVacantes: async (codHorario) => {
  try {
    const connection = await dbConnection();
    const query = 'SELECT vacantes FROM Horarios WHERE codHorario = ?';
    const [rows] = await connection.query(query, [codHorario]);
    connection.release();
    if (rows.length === 0) {
      return null; // No se encontró el horario
    }
    return rows[0].vacantes; // Retorna la cantidad de vacantes
  } catch (error) {
    throw new Error('Error al obtener vacantes: ' + error);
  }
},



getHorarioById: async (codHorario) => {
  try {
    const connection = await dbConnection();
    
    // Consulta para obtener el horario con detalles del taller e instructor
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
        h.edad,
        h.turno,
        h.vacantes,
        h.codInstructor,
        t.titulo AS nombreTaller,
        u.nombres AS nombreInstructor
      FROM 
        Horarios h
      LEFT JOIN 
        Talleres t ON h.codTalleres = t.codTalleres
      LEFT JOIN
        Usuarios u ON h.codInstructor = u.codUsuario
      WHERE 
        h.codHorario = ?`;
        
    const [rows] = await connection.query(query, [codHorario]);
    connection.release();

    // Verificar si se encontró el horario
    if (rows.length === 0) {
      return { success: false, message: 'Horario no encontrado' };
    }

    // Parsear el campo "horario" para mostrar solo el primer elemento como texto
    const horarioData = rows[0];
    let horarioText = '';
    if (horarioData.horario) {
      const horarioArray = JSON.parse(horarioData.horario);
      horarioText = horarioArray.length > 0 ? horarioArray[0].hora : '';
    }

    // Retornar el horario encontrado con los campos solicitados
    return {
      success: true,
      horario: {
        codHorario: horarioData.codHorario,
        codTalleres: horarioData.codTalleres,
        dias: horarioData.dias,
        horario: horarioText, // Mostrar solo el primer elemento del horario como texto
        tiempo: horarioData.tiempo,
        precio: horarioData.precio,
        precioSurcano: horarioData.precioSurcano,
        sesiones: horarioData.sesiones,
        edad: horarioData.edad,
        turno: horarioData.turno,
        vacantes: horarioData.vacantes,
        codInstructor: horarioData.codInstructor,
        nombreTaller: horarioData.nombreTaller,
        nombreInstructor: horarioData.nombreInstructor
      },
    };
  } catch (error) {
    throw new Error('Error al obtener el horario por ID: ' + error);
  }
}




};

module.exports = Horarios;
