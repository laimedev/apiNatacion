const dbConnection = require('../core/db_config');


const Extras = { 

 
  // Obtener el precio basado en el tipo de cliente y la disponibilidad de vacantes
  getPriceByClientAndHorario: async (codCliente, codHorario) => {
    try {
      const connection = await dbConnection();
      
      // Consulta para obtener el tipo de cliente
      const [clientRows] = await connection.query('SELECT tipo FROM Clientes WHERE codCliente = ?', [codCliente]);
      
      if (clientRows.length === 0) {
        connection.release();
        throw new Error('Cliente no encontrado');
      }
      
      const clientType = clientRows[0].tipo;
  
      // Consulta para obtener los datos del horario, su respectivo taller y el nombre del instructor
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
          h.codInstructor,
          t.titulo AS nombreTaller,
          u.nombres AS nombreInstructor -- Obtener el nombre del instructor
        FROM 
          Horarios h
        LEFT JOIN 
          Talleres t ON h.codTalleres = t.codTalleres
        LEFT JOIN
          Usuarios u ON h.codInstructor = u.codUsuario
        WHERE 
          h.codHorario = ?`;
          
      const [horarioRows] = await connection.query(query, [codHorario]);
  
      if (horarioRows.length === 0) {
        connection.release();
        throw new Error('Horario no encontrado');
      }
      
      const horario = horarioRows[0];
  
      // Verificar si hay vacantes disponibles
      if (horario.vacantes <= 0) {
        connection.release();
        return { success: false, message: 'No hay vacantes disponibles para este horario' };
      }
  
      // Seleccionar el precio basado en el tipo de cliente
      const precio = clientType === 'VECINOSURCANO' ? horario.precioSurcano : horario.precio;
  
      // Convertir el campo "horario" de JSON y tomar solo el primer elemento como texto
      let horarioText = '';
      if (horario.horario) {
        const horarioArray = JSON.parse(horario.horario);
        horarioText = horarioArray.length > 0 ? horarioArray[0].hora : '';
      }
  
      // Retornar solo la información solicitada
      connection.release();
      return {
        success: true,
        message: 'Vacantes disponibles',
        horario: {
          codHorario: horario.codHorario,
          codTalleres: horario.codTalleres,
          dias: horario.dias,
          horario: horarioText, // Solo el primer registro como texto
          tiempo: horario.tiempo,
          precio: horario.precio,
          precioSurcano: horario.precioSurcano,
          sesiones: horario.sesiones,
          vacantes: horario.vacantes,
          codInstructor: horario.codInstructor,
          nombreTaller: horario.nombreTaller,
          nombreInstructor: horario.nombreInstructor, // Nombre del instructor
          tipoCliente: clientType,
          precioCalculado: precio
        },
      };
    } catch (error) {
      throw new Error('Error al calcular el precio: ' + error);
    }
  }
  
  
  


};



module.exports = Extras;