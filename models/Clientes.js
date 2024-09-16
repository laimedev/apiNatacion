/*const connection = require('../core/db_config'); // Archivo de configuración de la base de datos

const Cliente = {
    create: async (clienteData) => {
        return new Promise((resolve, reject) => {
          const query = 'INSERT INTO cliente SET ?';
          connection.query(query, clienteData, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.insertId);
            }
          });
        });
      },
  // Otros métodos del modelo Cliente, como findAll, findById, update, delete, etc.

    // ...otros métodos del modelo Cliente...
  
    findOne: async (conditions) => {
        return new Promise((resolve, reject) => {
          const query = 'SELECT * FROM cliente WHERE ?';
          connection.query(query, conditions, (error, results) => {
            if (error) {
              reject(error);
            } else {
              if (results.length > 0) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            }
          });
        });
      },
  };

module.exports = Cliente;
*/

const dbConnection = require('../core/db_config');

const Cliente = {
  create: async (clienteData) => {
    try {
      const connection = await dbConnection();
      const query = 'INSERT INTO cliente SET ?';
      const result = await connection.query(query, clienteData);
      connection.release();
      return result.insertId;
    } catch (error) {
      throw new Error(error);
    }
  },

  // Otros métodos del modelo Cliente, como findAll, findById, update, delete, etc.

  // findOne: async (conditions) => {
  //   try {
  //     const connection = await dbConnection();
  //     const query = 'SELECT * FROM cliente WHERE ?';
  //     const [results] = await connection.query(query, conditions);
  //     connection.release();
  //     if (results.length > 0) {
  //       return results[0];
  //     } else {
  //       return null;
  //     }
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // },

  findOne: async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM cliente WHERE ?';
      const [results] = await connection.query(query, conditions);
      connection.release();
      
      if (results.length > 0) {
        const cliente = results[0];
        if (cliente.estado === 'ACTIVO') {
          return cliente;
        } else {
          // Cliente inactivo, no permitir el inicio de sesión y enviar un mensaje
          return { error: 'Este usuario ha sido desactivado. Comuníquese con el administrador.' };
        }
      } else {
        // Cliente no encontrado
        return null;
      }
    } catch (error) {
      throw new Error(error);
    }
  },


  updateToken: async (clienteId, token) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE cliente SET remember_token = ? WHERE codCliente = ?';
      await connection.query(query, [token, clienteId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  updatePassword: async (clienteId, hashedPassword) => {
    try {
      const connection = await dbConnection();
      const query = 'UPDATE cliente SET password = ? WHERE codCliente = ?';
      await connection.query(query, [hashedPassword, clienteId]);
      connection.release();
    } catch (error) {
      throw new Error(error);
    }
  },
  findOneDni:async (conditions) => {
    try {
      const connection = await dbConnection();
      const query = 'SELECT * FROM cliente WHERE ?';
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
};

module.exports = Cliente;
