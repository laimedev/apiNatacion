const dbConnection = require('../../core/db_config');

const SolicitudTea = {
  create: async (formData) => {
    try {
        const connection = await dbConnection();
        const query = 'INSERT INTO solicitudTemuss SET ?';
        const [result] = await connection.query(query, formData);
        connection.release();
        return result.insertId; // Devuelve el ID autogenerado
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error al crear la solicitud');
    }
  },


  update: async (codSolicitud, formData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE solicitudTemuss SET ? WHERE codSolicitud = ?';
      await connection.query(query, [formData, codSolicitud]);
      connection.release();
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Error al actualizar la solicitud');
    }
  },

  



  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM solicitudTemuss WHERE ?';
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


  findById: async (codSolicitud) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM solicitudTemuss WHERE codSolicitud = ?';
      const [results] = await connection.query(query, [codSolicitud]);
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


  findOneCategoriaPorpuesta: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM solicitudTemuss WHERE codClienteTemuss = ? AND categoria_propuesta = ?';
      const [results] = await connection.query(query, [conditions.codClienteTemuss, conditions.categoria_propuesta]);
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
  



  updateSolicitud: async (	codSolicitud, updatedUserData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE solicitudTemuss SET ? WHERE 	codSolicitud = ?';
      const result = await connection.query(query, [updatedUserData, 	codSolicitud]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

 getSolicitudById: async (codSolicitud) => {
  try {
    const connection = await dbConnection();
    const query = 'SELECT * FROM solicitudTemuss WHERE codSolicitud = ?';
    const [rows] = await connection.query(query, [codSolicitud]);
    connection.release();
    
    if (rows.length === 0) {
      return null;
    }

    // Convertir las cadenas "true"/"false" a valores booleanos
    const result = rows[0];
    Object.keys(result).forEach(key => {
      if (result[key] === 'true') {
        result[key] = true;
      } else if (result[key] === 'false') {
        result[key] = false;
      }
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
},



  getUserById: async (codClienteTemuss, page = 1, limit = 10, search = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
  
      // Construcción de la consulta SQL
      let query = 'SELECT * FROM solicitudTemuss WHERE codClienteTemuss = ?';
      const conditions = [];
  
      // Agrega las condiciones para la búsqueda por título propuesta
      if (search) {
        conditions.push(`
          titulo_propuesta LIKE '%${search}%'
        `);
      }
  
      // Agrega las condiciones para el rango de fechas
      if (startDate && endDate) {
        conditions.push(`
          creacion BETWEEN '${startDate}' AND '${endDate}'
        `);
      }
  
      // Aplica las condiciones adicionales si existen
      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }
  
      // Orden y paginación
      query += ' ORDER BY creacion DESC';
      query += ` LIMIT ${limit} OFFSET ${offset}`;
  
      // Ejecuta la consulta
      const [rows] = await connection.query(query, [codClienteTemuss]);
  
      // Obtiene el total de registros para la paginación
      const totalCountQuery = 'SELECT COUNT(*) AS total FROM solicitudTemuss WHERE codClienteTemuss = ?';
      const [countRows] = await connection.query(totalCountQuery, [codClienteTemuss]);
      const total = countRows[0].total;
  
      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },





  // , 
  //         (CASE WHEN codClienteTemuss IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN tipo_persona IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN nombre_postulante IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN razon_social IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN nombre_representante_legal IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN tipo_documento IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN num_documento IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN lugar_residencia IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN email IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN telefono IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN resumen_trayectoria IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN categoria_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN propuesta_artistica IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN titulo_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN sinopsis_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN resumen_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN objetivo_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN utileria IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN requerimientos IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN publico_objetivo IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN duracion_aprox IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN integrantes_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN titulos_creditos IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN incluye_obras IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN fechas_propuesta_start IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN fechas_propuesta_end IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN decla_bajo_juramento IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN decla_sentencia_deli IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN autorizacion_titulares IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN declar_propuesta IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN compromiso_brindar IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN responsable_veracidad IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN acepto_compromisos IS NULL THEN 1 ELSE 0 END) +
  //         (CASE WHEN firma IS NULL THEN 1 ELSE 0 END) 
  //         AS cantidad_campos_null


  getListUserById: async (codClienteTemuss, page = 1, limit = 10, search = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
    
      // Construcción de la consulta SQL
      let query = `
        SELECT * FROM solicitudTemuss WHERE codClienteTemuss = ?`;
  
      const conditions = [];
    
      // Agrega las condiciones para la búsqueda por título propuesta
      if (search) {
        conditions.push(`titulo_propuesta LIKE ?`);
      }
    
      // Agrega las condiciones para el rango de fechas
      if (startDate && endDate) {
        conditions.push(`creacion BETWEEN ? AND ?`);
      }
    
      // Aplica las condiciones adicionales si existen
      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }
    
      // Orden y paginación
      query += ' ORDER BY creacion DESC';
      // query += ' LIMIT ? OFFSET ?';
      query += ` LIMIT ${limit} OFFSET ${offset}`;

    
      // Ejecuta la consulta
      const [rows] = await connection.query(query, [
        codClienteTemuss,
        search ? `%${search}%` : null,
        startDate,
        endDate,
        limit,
        offset
      ]);
    
      // Obtiene el total de registros para la paginación
      const totalCountQuery = `
        SELECT COUNT(*) AS total 
        FROM solicitudTemuss 
        WHERE codClienteTemuss = ?`;
      const [countRows] = await connection.query(totalCountQuery, [codClienteTemuss]);
      const total = countRows[0].total;
    
      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },
  



  getListSolciitudes: async (page = 1, limit = 10, search = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;  // Asegurarse de que OFFSET esté bien calculado
      
      // Construcción de la consulta SQL
      let query = `
        SELECT s.*, 
               c.nombres AS nombres_cliente, 
               c.primer_apellido AS primer_apellido_cliente, 
               c.segundo_apellido AS segundo_apellido_cliente, 
               c.telefono AS telefono_cliente, 
               c.email AS email_cliente
        FROM solicitudTemuss s
        JOIN clientesTemuss c ON s.codClienteTemuss = c.codCliente
      `;
      
      const conditions = [];
      const queryParams = [];
  
      // Agrega las condiciones para la búsqueda por título propuesta
      if (search) {
        conditions.push(`s.titulo_propuesta LIKE ?`);
        queryParams.push(`%${search}%`);
      }
  
      // Agrega las condiciones para el rango de fechas
      if (startDate && endDate) {
        conditions.push(`s.creacion BETWEEN ? AND ?`);
        queryParams.push(startDate, endDate);
      }
  
      // Aplica las condiciones adicionales si existen
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
  
      // Orden y paginación
      query += ' ORDER BY s.creacion DESC';
      query += ' LIMIT ? OFFSET ?'; // Siempre asegurarse de agregar LIMIT y OFFSET
      queryParams.push(limit, offset);
  
      // Ejecuta la consulta principal
      const [rows] = await connection.query(query, queryParams);
  
      // Construcción de la consulta SQL para el total de registros, incluyendo las condiciones de búsqueda
      let totalCountQuery = `
        SELECT COUNT(*) AS total
        FROM solicitudTemuss s
        JOIN clientesTemuss c ON s.codClienteTemuss = c.codCliente
      `;
  
      if (conditions.length > 0) {
        totalCountQuery += ' WHERE ' + conditions.join(' AND ');
      }
  
      const [countRows] = await connection.query(totalCountQuery, queryParams.slice(0, queryParams.length - 2)); // Retira LIMIT y OFFSET
      const total = countRows[0].total;
  
      connection.release();
      return { users: rows, total };
    } catch (error) {
      throw new Error(error);
    }
  },
  
  



  
  deleteSolicitudById: async (userId) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM solicitudTemuss WHERE codSolicitud = ?';
      await connection.query(query, [userId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },



};

module.exports = SolicitudTea;