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
    }
  
};

module.exports = Inscripciones;