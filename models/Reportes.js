
const dbConnection = require('../core/db_config');

const Reportes = {
  create: async (formData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO localidad SET ?';
      const result = await connection.query(query, formData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },



  getReservaSearch: async (codLocalidad, fechRegistro, horainicio) => {
    try {
      const connection = await dbConnection(); // Obtener la conexión a la base de datos
      const query = `
        SELECT 
        registro.codRegistro AS codRegistro,
        registro.costoTarifa AS costoTarifa,
        registro.duracion AS duracion,
        registro.venta_id AS venta_id,
        registro.estado AS estado,
        CONCAT(registro.fechRegistro, ' ', registro.horainicio ) AS fechaInicio,
        CONCAT(registro.fechRegistro, ' ', registro.horafinal ) AS fechaFinal,
        localidad.nomLocalidad AS nomLocalidad,
        CONCAT(Clientes.nombres, ' ', Clientes.primer_apellido, ' ', Clientes.segundo_apellido , ' | ' , Clientes.numDocumento, ' | ', Clientes.tipo ) AS nombreCompleto
        FROM registro
        JOIN localidad ON registro.codLocalidad = localidad.codLocalidad
        JOIN Clientes ON registro.codCliente = Clientes.codCliente
        WHERE registro.codLocalidad = ? AND registro.fechRegistro = ? AND registro.horainicio = ?
      `;
      const [rows] = await connection.query(query, [codLocalidad, fechRegistro, horainicio]);
      connection.release(); // Liberar la conexión

      if (rows.length === 0) {
        return null; // Si no se encuentra ningún registro, devuelve null
      }
      return rows[0]; // Devuelve el primer registro encontrado
    } catch (error) {
      throw new Error(error); // Captura y lanza cualquier error ocurrido durante la consulta
    }
  },



  
  getReservaSearchByID: async (codRegistro) => {
    try {
      const connection = await dbConnection(); // Obtener la conexión a la base de datos
      const query = `
        SELECT 
        registro.codRegistro AS codRegistro,
        registro.costoTarifa AS costoTarifa,
        registro.duracion AS duracion,
        registro.venta_id AS venta_id,
        registro.estado AS estado,
        CONCAT(registro.fechRegistro, ' ', registro.horainicio ) AS fechaInicio,
        CONCAT(registro.fechRegistro, ' ', registro.horafinal ) AS fechaFinal,
        localidad.nomLocalidad AS nomLocalidad,
        CONCAT(cliente.nombres, ' ', cliente.primer_apellido, ' ', cliente.segundo_apellido , ' | ' , cliente.numDocumento, ' | ', cliente.tipo ) AS nombreCompleto
        FROM registro
        JOIN localidad ON registro.codLocalidad = localidad.codLocalidad
        JOIN cliente ON registro.codCliente = cliente.codCliente
        WHERE registro.codRegistro = ?
      `;
      const [rows] = await connection.query(query, [codRegistro]);
      connection.release(); // Liberar la conexión

      if (rows.length === 0) {
        return null; // Si no se encuentra ningún registro, devuelve null
      }
      return rows[0]; // Devuelve el primer registro encontrado
    } catch (error) {
      throw new Error(error); // Captura y lanza cualquier error ocurrido durante la consulta
    }
  },




  // 2024-04-24 20:00:00 

  changeStatus: async (codLocalidad, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET ? WHERE codLocalidad = ?';
      const result = await connection.query(query, [updatedData, codLocalidad]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },



  updateLocalidad: async (codLocalidad, updatedData) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET ? WHERE codLocalidad = ?';
      const result = await connection.query(query, [updatedData, codLocalidad]);
      connection.release();
      return result.affectedRows;
    } catch (error) {
      throw new Error(error);
    }
  },












  getReservas: async (page = 1, limit = 10, search = '', venta_id , estado,  startDate, endDate) => {
    try {
      const connection = await dbConnection();
      const offset = (page - 1) * limit;
      let query = `SELECT
      registro.codRegistro,
      registro.fechRegistro,
      registro.horainicio,
      registro.horafinal,
      registro.estado AS estadoRegistro,
      registro.comentario,
      registro.duracion,
      cliente.nombres AS nomCliente,
      localidad.nomLocalidad AS nomLocalidad,
      registro.codCliente AS codCliente,
      registro.codLocalidad,
      registro.codUsuario,
      registro.costoTarifa,
      cliente.primer_apellido,
      cliente.segundo_apellido,
      cliente.tipo,
      cliente.telefono,
      cliente.numDocumento,
      registro.venta_id
  FROM
      registro
      JOIN cliente ON registro.codCliente = cliente.codCliente
      JOIN localidad ON registro.codLocalidad = localidad.codLocalidad`;
      
        if (search) {
          query += ` AND  registro.codLocalidad LIKE '%${search}%'`;
        }

        if (venta_id) {
          // query += ` AND  registro.venta_id LIKE '%${venta_id}%'`;
          // query += ` AND (registro.venta_id LIKE '%${venta_id}%' OR registro.codRegistro LIKE '%${venta_id}%')`;
          query += ` AND (registro.venta_id = '${venta_id}' OR registro.codRegistro = '${venta_id}')`;
        }
  
        if (estado) {
            query += ` AND registro.estado LIKE '%${estado}%'`;
        }



         if (startDate && endDate) {

          query += ` AND fechRegistro BETWEEN '${startDate}' AND '${endDate}'`; 

          // if (search || estado) {
          //   query += ' AND'; 
          // } else {
          //   query += ' WHERE'; 
          // }
        }
        query += ' ORDER BY fechRegistro DESC, horainicio DESC';
        query += ` LIMIT ${limit} OFFSET ${offset}`;
        const [rows] = await connection.query(query);
        const totalCountQuery = `SELECT COUNT(*) AS total FROM registro`;
        const [countRows] = await connection.query(totalCountQuery);
        const total = countRows[0].total;
        connection.release();
        return { data: rows, total };
      } catch (error) {
        throw new Error(error);
      }
    },
  


    getAllReservas:  async (search = '', venta_id,  estado,  startDate, endDate ) => {
      try {
        const connection = await dbConnection();
        let query =  `SELECT
              registro.codRegistro AS codRegistro,
              registro.fechRegistro AS fechRegistro,
              registro.horainicio AS horainicio,
              registro.horafinal AS horafinal,
              registro.estado AS estadoRegistro,
              registro.comentario,
              registro.duracion AS duracion,
              cliente.nombres AS nomCliente,
              registro.codCliente,
              localidad.nomLocalidad AS nomLocalidad ,
              registro.codUsuario,
              registro.costoTarifa AS costoTarifa,
              cliente.primer_apellido AS primer_apellido,
              cliente.segundo_apellido AS segundo_apellido,
              cliente.tipo AS tipo,
              cliente.telefono,
              cliente.numDocumento AS numDocumento,
              registro.venta_id,
              ROW_NUMBER() OVER(PARTITION BY registro.venta_id ORDER BY registro.costoTarifa DESC) AS RowNum
          FROM
              registro
              JOIN cliente ON registro.codCliente = cliente.codCliente
              JOIN localidad ON registro.codLocalidad = localidad.codLocalidad
        `;

        if (search) {
          query += ` AND  registro.codLocalidad LIKE '%${search}%'`;
        }

        if (venta_id) {
          query += ` AND (registro.venta_id = '${venta_id}' OR registro.codRegistro = '${venta_id}')`;
        }

        if (estado) {
          query += ` AND registro.estado LIKE '%${estado}%'`;
        }

        if (startDate && endDate) {
          query += ` AND fechRegistro BETWEEN '${startDate}' AND '${endDate}'`; 
        }

        query += ' ORDER BY fechRegistro DESC, horainicio DESC';

        const [rows] = await connection.query(query);
        connection.release();
        return rows;
      } catch (error) {
        throw new Error(error);
      }
    },




    // getAllReservas:  async (search = '', estado,  startDate, endDate ) => {
    //   try {
    //     const connection = await dbConnection();
    //     const query =  `WITH CTE AS (
    //       SELECT
    //           registro.codRegistro AS codRegistro,
    //           registro.fechRegistro AS fechRegistro,
    //           registro.horainicio AS horainicio,
    //           registro.horafinal AS horafinal,
    //           registro.estado AS estadoRegistro,
    //           registro.comentario,
    //           registro.duracion AS duracion,
    //           cliente.nombres AS nomCliente,
    //           registro.codCliente,
    //           registro.codLocalidad,
    //           registro.codUsuario,
    //           registro.costoTarifa AS costoTarifa,
    //           cliente.primer_apellido AS primer_apellido,
    //           cliente.segundo_apellido AS segundo_apellido,
    //           cliente.tipo AS tipo,
    //           cliente.telefono,
    //           cliente.numDocumento AS numDocumento,
    //           registro.venta_id,
    //           ROW_NUMBER() OVER(PARTITION BY registro.venta_id ORDER BY registro.costoTarifa DESC) AS RowNum
    //       FROM
    //           registro
    //           JOIN cliente ON registro.codCliente = cliente.codCliente
    //     )
    //     SELECT
    //       CTE.*,
    //       (
    //           SELECT GROUP_CONCAT(localidad.nomLocalidad ORDER BY localidad.nomLocalidad SEPARATOR ', ')
    //           FROM localidad
    //           JOIN registro ON registro.codLocalidad = localidad.codLocalidad
    //           WHERE registro.venta_id = CTE.venta_id
    //       ) AS nomLocalidad
    //     FROM CTE
    //     WHERE
    //       RowNum = 1 
    //     AND venta_id IS NOT NULL
    //     `;
    //     const [rows] = await connection.query(query);
    //     connection.release();
    //     return rows;
    //   } catch (error) {
    //     throw new Error(error);
    //   }
    // },









  getAllLocalidad:  async () => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad';
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
    } catch (error) {
      throw new Error(error);
    }
  },


    deleteByVentaId: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'DELETE FROM registro WHERE venta_id = ?';
        await connection.query(query, [userId]);
        connection.release();
      } catch (error) {
        throw new Error(error);
      }
    },


    getById: async (userId) => {
      try {
        const connection = await dbConnection();
        const query = 'SELECT * FROM localidad WHERE codLocalidad = ?';
        const [rows] = await connection.query(query, [userId]);
        connection.release();
        if (rows.length === 0) {
          return null; 
        }
        return rows[0];
      } catch (error) {
        throw new Error(error);
      }
    },



     // Otros métodos del modelo Admin, como findAll, findById, update, delete, etc.

  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad WHERE ?';
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
  updateToken: async (usuarioId, token) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET remember_token = ? WHERE codSucursal = ?';
      await connection.query(query, [token, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  updatePassword: async (usuarioId, hashedPassword) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE localidad SET password = ? WHERE codSucursal = ?';
      await connection.query(query, [hashedPassword, usuarioId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  findOneDni:async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM localidad WHERE ?';
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
  }

};

module.exports = Reportes;
