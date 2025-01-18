const dbConnection = require('../core/db_config');

const Alumnos = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO Alumnos SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },


  getAllWithDetails: async () => {
    try {
      const connection = await dbConnection();
      const query = `
        SELECT 
          a.codAlumno, a.codCliente, a.nombres AS alumnoNombres, a.apellidos AS alumnoApellidos, 
          a.genero, a.condicion, a.fecha_nacimiento, a.codInscripcion,
          i.fechaInscripcion, i.costoTarifa, i.estado, i.tiempo, i.dias, i.horario,
          p.codPago, p.fechaPago, p.metodoPago, p.importePago, p.venta_id,
          c.nombres AS clienteNombres, c.primer_apellido AS clienteApellido, 
          c.email AS clienteEmail, c.telefono AS clienteTelefono
        FROM 
          Alumnos a
        LEFT JOIN 
          Inscripciones i ON a.codInscripcion = i.codInscripcion
        LEFT JOIN 
          Pagos p ON i.codInscripcion = p.codInscripcion
        LEFT JOIN 
          Clientes c ON a.codCliente = c.codCliente
        ORDER BY 
          a.codAlumno, p.codPago;
      `;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error('Error al obtener los detalles del alumno, inscripción y cliente: ' + error);
    }
  },


  getByCodInscripcion: async (codInscripcion) => {
    try {
      const connection = await dbConnection();
      const query = `
        SELECT 
          a.codAlumno, a.codCliente, a.nombres AS alumnoNombres, a.apellidos AS alumnoApellidos, 
          a.genero, a.condicion, a.fecha_nacimiento, a.codInscripcion,
          i.fechaInscripcion, i.costoTarifa, i.estado, i.tiempo, i.dias, i.horario,
          p.codPago, p.fechaPago, p.metodoPago, p.importePago, p.venta_id,
          c.nombres AS clienteNombres, c.primer_apellido AS clienteApellido, 
          c.email AS clienteEmail, c.telefono AS clienteTelefono
        FROM 
          Alumnos a
        LEFT JOIN 
          Inscripciones i ON a.codInscripcion = i.codInscripcion
        LEFT JOIN 
          Pagos p ON i.codInscripcion = p.codInscripcion
        LEFT JOIN 
          Clientes c ON a.codCliente = c.codCliente
        WHERE 
          a.codInscripcion = ?
        ORDER BY 
          p.codPago;
      `;
      const [rows] = await connection.query(query, [codInscripcion]);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error('Error al obtener los detalles por inscripción: ' + error);
    }
  },



  findByClientId: async (codCliente) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM Alumnos WHERE codCliente = ?';
      const [results] = await connection.query(query, [codCliente]);
      connection.release();
      return results;
    } catch (error) {
      throw new Error(error);
    }
  },

  updateStudent: async (codAlumno, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE Alumnos SET ? WHERE codAlumno = ?';
      const result = await connection.query(query, [updatedData, codAlumno]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },

  deleteById: async (codAlumno) => {
    try {
      const connection = await dbConnection();
      const query = 'DELETE FROM Alumnos WHERE codAlumno = ?';
      await connection.query(query, [codAlumno]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  }
};

module.exports = Alumnos;