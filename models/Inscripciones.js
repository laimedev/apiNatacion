const dbConnection = require('../core/db_config');

const Inscripciones = {
  create: async (inscripcionData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Inscripciones SET ?';
      const [result] = await connection.query(query, inscripcionData);
      connection.release();
      return result.insertId; // Retorna el ID de la inscripción creada
    } catch (error) {
      throw new Error('Error al crear inscripción: ' + error);
    }
  },

  // Función para obtener las inscripciones y pagos por codCliente
  getByClienteWithPayments: async (codCliente) => {
    try {
      const connection = await dbConnection();
      const query = `
        SELECT 
          i.codInscripcion,
          i.codTalleres,
          t.titulo AS nombreTaller,   -- Aquí incluimos el título del taller
          i.dias,
          i.horario,
          i.fechaInscripcion,
          i.costoTarifa,
          i.codAlumno,
          i.codCliente,
          i.codHorario,
          i.tiempo,
          i.clases,
          i.email AS emailInscripcion,
          p.fechaPago,
          p.metodoPago,
          p.importePago,
          p.venta_id,
          c.nombres,
          c.primer_apellido,
          c.segundo_apellido,
          c.telefono,
          c.email AS emailCliente,
          c.numDocumento,
          c.tipo AS tipoCliente -- Añadimos el campo tipo
        FROM 
          Inscripciones i
        LEFT JOIN 
          Pagos p ON i.codInscripcion = p.codInscripcion
        LEFT JOIN 
          Clientes c ON i.codCliente = c.codCliente
        LEFT JOIN 
          Talleres t ON i.codTalleres = t.codTalleres   -- Aquí hacemos el JOIN con la tabla Talleres
        WHERE 
          i.codCliente = ?`;
      
      const [rows] = await connection.query(query, [codCliente]);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error('Error al obtener inscripciones con pagos y datos del cliente: ' + error);
    }
  },
  

  getByFilters: async (page = 1, limit = 10, searchTerm = '', codTalleres = '', startDate = '', endDate = '') => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          i.codInscripcion,
          i.codTalleres,
          t.titulo AS nombreTaller,
          i.dias,
          i.horario,
          i.fechaInscripcion,
          i.costoTarifa,
          i.codAlumno,
          i.codCliente,
          i.codHorario,
          i.tiempo,
          i.clases,
          i.email AS emailInscripcion,
          p.fechaPago,
          p.metodoPago,
          p.importePago,
          p.venta_id,
          c.nombres,
          c.primer_apellido,
          c.segundo_apellido,
          c.telefono,
          c.email AS emailCliente,
          c.numDocumento,
          c.tipo AS tipoCliente -- Añadimos el campo tipo
        FROM 
          Inscripciones i
        LEFT JOIN 
          Pagos p ON i.codInscripcion = p.codInscripcion
        LEFT JOIN 
          Clientes c ON i.codCliente = c.codCliente
        LEFT JOIN 
          Talleres t ON i.codTalleres = t.codTalleres
        WHERE 1=1`;

      // Filtrar por codTalleres (específico de un taller) desde la tabla `Talleres`
      if (codTalleres) {
        query += ` AND t.codTalleres = ?`; // Cambiado para filtrar en la tabla Talleres
      }

      // Búsqueda por nombres o apellidos del cliente
      if (searchTerm) {
        query += ` AND (t.titulo LIKE '%${searchTerm}%' OR i.codInscripcion LIKE '%${searchTerm}%')`;

        // query += ` AND (c.nombres LIKE '%${search}%' 
        //             OR c.primer_apellido LIKE '%${search}%' 
        //             OR c.segundo_apellido LIKE '%${search}%' 
        //             OR c.numDocumento LIKE '%${search}%')%
        //             OR t.titulo LIKE '%${search}%')`;
      }

      // Filtro por fechas de inscripción
      if (startDate && endDate) {
        query += ` AND i.fechaInscripcion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      // Ordenar por fecha de inscripción descendente
      query += ' ORDER BY i.fechaInscripcion DESC';

      // Paginación
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await connection.query(query, [codTalleres]);

      // Contar el total de registros
      let totalCountQuery = `
        SELECT COUNT(*) AS total FROM Inscripciones i
        LEFT JOIN Clientes c ON i.codCliente = c.codCliente
        LEFT JOIN Talleres t ON i.codTalleres = t.codTalleres
        WHERE 1=1`;

      if (codTalleres) {
        totalCountQuery += ` AND t.codTalleres = ?`; // Filtrar por codTalleres en el conteo total
      }

      if (searchTerm) {
          totalCountQuery += ` AND (t.titulo LIKE '%${searchTerm}%' OR i.codInscripcion LIKE '%${searchTerm}%')`;

        // totalCountQuery += ` AND (c.nombres LIKE '%${searchTerm}%' 
        //                      OR c.primer_apellido LIKE '%${searchTerm}%' 
        //                      OR c.segundo_apellido LIKE '%${searchTerm}%' 
        //                      OR c.numDocumento LIKE '%${searchTerm}%')`;
      }

      if (startDate && endDate) {
        totalCountQuery += ` AND i.fechaInscripcion BETWEEN '${startDate}' AND '${endDate}'`;
      }

      const [totalCountRows] = await connection.query(totalCountQuery, [codTalleres]);
      const total = totalCountRows[0].total;

      connection.release();
      return { inscripciones: rows, total };
    } catch (error) {
      throw new Error('Error al obtener inscripciones: ' + error.message);
    }
  },


      // Función para eliminar una inscripción y sus pagos asociados
      deleteById: async (codInscripcion) => {
        try {
          const connection = await dbConnection();
    
          // Iniciar una transacción
          await connection.beginTransaction();
    
          // Eliminar los pagos relacionados con la inscripción
          const deletePagosQuery = 'DELETE FROM Pagos WHERE codInscripcion = ?';
          await connection.query(deletePagosQuery, [codInscripcion]);
    
          // Eliminar la inscripción
          const deleteInscripcionQuery = 'DELETE FROM Inscripciones WHERE codInscripcion = ?';
          await connection.query(deleteInscripcionQuery, [codInscripcion]);
    
          // Confirmar la transacción
          await connection.commit();
          connection.release();
    
          return { message: 'Inscripción y pagos eliminados correctamente' };
        } catch (error) {
          console.error('Error al eliminar inscripción y pagos:', error);
    
          // Deshacer la transacción en caso de error
          connection.rollback();
          connection.release();
    
          throw new Error('Error al eliminar inscripción y pagos');
        }
      }
  
};

module.exports = Inscripciones;