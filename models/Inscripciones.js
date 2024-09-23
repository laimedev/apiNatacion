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
            c.numDocumento
          FROM 
            Inscripciones i
          LEFT JOIN 
            Pagos p ON i.codInscripcion = p.codInscripcion
          LEFT JOIN 
            Clientes c ON i.codCliente = c.codCliente
          WHERE 
            i.codCliente = ?`;
        
        const [rows] = await connection.query(query, [codCliente]);
        connection.release();
        return rows;
      } catch (error) {
        throw new Error('Error al obtener inscripciones con pagos y datos del cliente: ' + error);
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