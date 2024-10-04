const express = require('express');
const router = express.Router();
const dbConnection = require('../core/db_config'); // Importa el módulo para acceder a la base de datos
const moment = require('moment');
const {verifyToken, verifyTokenAndAuthorization} =require("./verifyToken")
const { Mutex } = require('async-mutex');
const mutex = new Mutex();


router.get('/listar/', async (req, res) => {
  try {
    const connection = await dbConnection();
    const mytime = moment().tz('America/Lima');
    const fecha = mytime.format('YYYY-MM-DD');
    const idFilter = req.query.id;
    let sql = `
      SELECT
        registro.codRegistro,
        registro.venta_id,
        registro.fechRegistro,
        registro.horainicio,
        registro.horafinal,
        registro.estado AS estadoRegistro,
        registro.costoTarifa AS costoTarifa,
        registro.comentario,
        registro.duracion,
        Clientes.nombres AS nomCliente,
        Clientes.tipo AS tipo,
        Clientes.primer_apellido AS primer_apellido,
        Clientes.segundo_apellido AS segundo_apellido,
        registro.codCliente,
        localidad.codLocalidad,
        localidad.nomLocalidad,
        registro.codUsuario
      FROM
        registro
        JOIN Clientes ON registro.codCliente = Clientes.codCliente
        JOIN localidad ON registro.codLocalidad = localidad.codLocalidad`;

    let params = [];

    if (idFilter) {
      sql += " WHERE registro.codLocalidad = ?";
      params.push(idFilter);
    }

    if (fecha) {
      sql += " and registro.fechRegistro >= ?";
      params.push(fecha);
    }

    const [rows] = await connection.query(sql, params); // Ejecuta la consulta utilizando la conexión

    const nueva_agenda = rows.map((value) => ({
      id: value.codRegistro,
      start: `${value.fechRegistro} ${value.horainicio}`,
      end: `${value.fechRegistro} ${value.horafinal}`,
      //title: `${value.estadoRegistro} - ${value.nomCliente}`,
      // title: `${value.estadoRegistro} - ${value.nomCliente} ${value.primer_apellido} ${value.segundo_apellido} || ${value.tipo}  || S/ ${value.costoTarifa} soles  ||  Nº Ticket: ${value.codRegistro} ||  ID Pago: ${value.venta_id} `,
      title: `${value.estadoRegistro} - ${value.nomCliente} ${value.primer_apellido} ${value.segundo_apellido} || ${value.tipo} || S/ ${value.costoTarifa} soles || Nº Ticket: ${value.codRegistro}${value.venta_id !== null ? ` || ID Pago: ${value.venta_id}` : ''}`,
      backgroundColor: value.estadoRegistro === 'SIN CONFIRMAR' ? '#c9101e' : '#155c6e',
      textColor: '#fff',
      extendedProps: {
        codRegistro: value.codRegistro,
        codCliente: value.codCliente,
        codLocalidad: value.codLocalidad,
        nomLocalidad: value.nomLocalidad,
        comentario: value.comentario,
        duracion: value.duracion,
        venta_id: value.venta_id,
        pago: value.pago,
        estado: value.estadoRegistro,
      },
    }));

    res.json(nueva_agenda);

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// Ruta para guardar el registro
// router.post('/guardar', verifyToken, async (req, res) => {
router.post('/guardar',  async (req, res) => {
  try {
    await mutex.acquire();
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const input = req.body;
    //console.log(validateTimeAndPrice(input.txtHoraInicial,input.txtHoraFinal,input.txtTiempo))

    // capi quite validacion porque no me dejaba guardar ms tiempo 
    // if(!validateTimeAndPrice(input.txtFecha,input.txtHoraInicial,input.txtHoraFinal,input.txtTiempo,input.ddlClientes)){
    //  return res.status(400).json({ error: 'No coinciden las horas de juego con el precio. Por favor, elija una sola hora o actualice su dispositivo.' });
    // }

    if (validarFecha(-1, input.ddlLocalidad, input.txtFecha, input.txtHoraInicial, input.txtHoraFinal)) {
      // Verificar si hay una campaña que comienza en la misma hora
      const [existingCampaigns] = await connection.query(
        //  'SELECT * FROM registro WHERE (horainicio <= ? AND horafinal >= ? ) AND codLocalidad = ? AND fechRegistro = ?',
        //[input.txtHoraInicial, input.txtHoraInicial, input.ddlLocalidad, input.txtFecha]
        'SELECT * FROM registro WHERE ((horainicio <= ? AND horafinal >= ?) OR (horainicio <= ? AND horafinal >= ?)) AND codLocalidad = ? AND fechRegistro = ?',
        [input.txtHoraInicial, input.txtHoraInicial, input.txtHoraFinal, input.txtHoraFinal, input.ddlLocalidad, input.txtFecha]
        );

      if (existingCampaigns.length > 0) {
        // Si hay una campaña que comienza en la misma hora y localidad, devolver una respuesta indicando que no se puede registrar la reserva
       // res.json({ ok: false, message: 'Ya hay una campaña que comienza en la misma hora y localidad.' });
        res.status(400).json({ error: 'Ya hay una campaña que comienza en la misma hora y localidad.' });
      } else {
        // Verificar si el cliente tiene 2 o más registros en el mismo día
        const [existingRecords] = await connection.query(
          'SELECT COUNT(*) AS recordCount FROM registro WHERE codCliente = ? AND fechRegistro = ?',
          [input.ddlClientes, input.txtFecha]
        );

        const { recordCount } = existingRecords[0];

        if (recordCount >= 2) {
          // Si el cliente ya tiene 2 o más registros en el mismo día, devolver una respuesta indicando que no se puede registrar más
          //res.json({ ok: false, message: 'El cliente ya tiene 2 o más registros en el mismo día.' });
          res.status(400).json({ error: 'El cliente ya tiene 2 o más registros en el mismo día.' });
        } else {
          // Si no hay campañas que cumplan con los criterios y el cliente no tiene 2 o más registros en el mismo día, insertar la reserva
          const registro = {
            codUsuario: 1, // Aquí puedes cambiarlo para obtener el código del usuario autenticado usando JWT
            codCliente: input.ddlClientes,
            codLocalidad: input.ddlLocalidad,
            // codCaja: caja.codCaja,
            fechRegistro: input.txtFecha,
            horainicio: input.txtHoraInicial,
            horafinal: input.txtHoraFinal,
            duracion: input.txtTiempo,
            estado: 'SIN CONFIRMAR',
            costoTarifa: input.costoTarifa,
            comentario: input.txtComentario,
            created_at:input.created_at,
            updated_at:input.updated_at,
            venta_id:input.venta_id,
            version:input.version
          };

          const [results] = await connection.query('INSERT INTO registro SET ?', registro); // Ejecuta la inserción utilizando la conexión
          const insertId = results.insertId;
          res.json({ ok: true , codRegistro:insertId});
        }
      }
    } else {
      res.status(400).json({ error: 'no pasa la validacion de fecha' });
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }finally {
    mutex.release();
  }
});

const validarFecha = async (id, codLocalidad, fecha, horaInicial, horaFinal) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos

    const mytime = moment().tz('America/Lima');
    const fecha_actual = mytime.format('YYYY-MM-DD');
    const hora_actual = mytime.format('HH:mm:ss');

    const query = `
      SELECT *
      FROM registro
      WHERE fechRegistro = ? AND codRegistro != ? AND codLocalidad = ?
        AND (horainicio BETWEEN ? AND ? OR horafinal BETWEEN ? AND ?)
      LIMIT 1
    `;

    const [results] = await connection.query(query, [
      fecha,
      id,
      codLocalidad,
      horaInicial,
      horaFinal,
      horaInicial,
      horaFinal
    ]); // Ejecuta la consulta utilizando la conexión

    if (new Date(`${fecha} ${horaInicial}`) < new Date(`${fecha_actual} ${hora_actual}`)) {
      return true;
    } else {
      return results.length === 0;
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    throw error;
  }
};

//listar registro por usuario
router.get('/listar-cliente/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `
      SELECT
        registro.codRegistro,
        registro.fechRegistro,
        registro.horainicio,
        registro.horafinal,
        registro.estado AS estadoRegistro,
        registro.comentario,
        registro.duracion,
        cliente.nombres AS nomCliente,
        registro.codCliente,
        localidad.codLocalidad,
        localidad.nomLocalidad,
        registro.codUsuario,
        registro.costoTarifa,
        cliente.primer_apellido,
        cliente.segundo_apellido,
        cliente.telefono,
        cliente.numDocumento
      FROM
        registro
        JOIN cliente ON registro.codCliente = cliente.codCliente
        JOIN localidad ON registro.codLocalidad = localidad.codLocalidad
      WHERE
        registro.codCliente = ?
      ORDER BY
        registro.fechRegistro DESC,
        registro.horainicio DESC
      limit 10`;

    const connection = await dbConnection(); // Obtén la conexión a la base de datos

    const [results] = await connection.query(sql, [id]); // Ejecuta la consulta utilizando la conexión

    if (results.length === 0) {
      res.status(404).json({ error: 'No hay reservas' });
    } else {
      const perfilUsuario = results;
      res.json(perfilUsuario);
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/precio', verifyToken, async (req, res) => {
  try {
    const { codCliente, codLocalidad, fechRegistro, horainicio, horafinal } = req.body;
    const clienteQuery = 'SELECT * FROM cliente WHERE codCliente = ?';
    const precioQueries = {
      CLIENTE: {
        '06:00:00-18:00:00': 'SELECT precioDia FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      },
      MAYOR: {
        '06:00:00-18:00:00': 'SELECT precioAdultosMayor FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      },
      MENOR: {
        '06:00:00-18:00:00': 'SELECT precioMenores FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      },
      VECINO_SI: {
        '06:00:00-18:00:00': 'SELECT precioVecinosSI FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      },
      VECINO_VSP: {
        '06:00:00-18:00:00': 'SELECT precioVecinosVSP FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      }
    };

    const connection = await dbConnection();

    const [clienteResults] = await connection.query(clienteQuery, [codCliente]);

    if (clienteResults.length === 0) {
      res.status(400).json({ error: 'Usuario no encontrado' });
      return;
    }

    const cliente = clienteResults[0];
    const tipoCliente = cliente.tipo;
    const hora = horainicio;

    const horaKey = (hora >= '06:00:00' && hora < '18:00:00') ? '06:00:00-18:00:00' : '18:00:00-22:00:00';
    const precioQuery = precioQueries[tipoCliente][horaKey];

    if (!precioQuery) {
      res.status(400).json({ error: 'Tipo de cliente o horario no válido' });
      return;
    }

    const [precioResults] = await connection.query(precioQuery, [codLocalidad]);

    if (precioResults.length === 0) {
      res.status(400).json({ error: 'Localidad no encontrada' });
      return;
    }

    const precio = precioResults[0].precioDia || precioResults[0].precioNoche || precioResults[0].precioAdultosMayor || precioResults[0].precioMenores || precioResults[0].precioVecinosSI || precioResults[0].precioVecinosVSP;
    res.json({ precio });

    connection.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.get('/registro/:id', async (req, res) => {
  try {
    const registroId = req.params.id;
    const registroQuery = 
    `SELECT codRegistro,codUsuario,registro.codCliente,fechRegistro ,horainicio,horafinal,tarifa, costoTarifa,cliente.nombres , cliente.primer_apellido , cliente.segundo_apellido, localidad.nomLocalidad , cliente.direccion,cliente.numDocumento,cliente.tipo
    FROM registro
    INNER JOIN cliente ON cliente.codCliente = registro.codCliente
    INNER JOIN localidad ON localidad.codLocalidad= registro.codLocalidad
    WHERE codRegistro = ?`

    const connection = await dbConnection();
    const [registroResults] = await connection.query(registroQuery, [registroId]);

    if (registroResults.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = registroResults[0];
    
    const resultado = {
     pedido
    };

    res.json(resultado);

    connection.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/validar-cantidad-reserva', async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const input = req.body;

    const horaInicial = new Date(`${input.txtFecha} ${input.txtHoraInicial}`);
    const horaFinal = new Date(`${input.txtFecha} ${input.txtHoraFinal}`);

    const duracionReserva = (horaFinal - horaInicial) / (1000 * 60); // Duración de la reserva en minutos

    // Obtener la cantidad total de minutos registrados para el cliente en la fecha especificada
    const [existingRecords] = await connection.query(
      'SELECT IFNULL(SUM(TIMESTAMPDIFF(MINUTE, horainicio, horafinal)), 0) AS totalMinutes FROM registro WHERE codCliente = ? AND fechRegistro = ?',
      [input.ddlClientes, input.txtFecha]
    );
    const { totalMinutes } = existingRecords[0];
    const suma = parseInt(totalMinutes) + duracionReserva
    // if (suma > 355) {
    if (suma > 5555) {
      // 220 es total a 355 que son 6 horas
      // Si la suma de los minutos registrados y la duración de la reserva superan los 110 minutos, devuelve un mensaje de error
      res.status(400).json({ error: 'La cantidad total de horas registradas en el día no puede exceder las 6 hrs.' });
    } else {
      // La reserva es válida
      res.json({ ok: true });
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// router.put('/confirmar/:id', verifyToken, async (req, res) => {
router.put('/confirmar/:id',  async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const id = req.params.id; // Obtén el ID de la campaña de los parámetros de la solicitud

    const { venta_id } = req.body;

    const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

    // Actualiza el estado de la campaña a "CONFIRMADO"
    //const [result] = await connection.query('UPDATE registro SET estado = ? WHERE codRegistro = ?  ', ['CONFIRMADO', id]);
    const [result] = await connection.query('UPDATE registro SET estado = ?, updated_at = ? WHERE codRegistro = ?', ['CONFIRMADO', updatedAt, id]);
    if (result.affectedRows === 0) {
      // Si no se encuentra la campaña con el ID proporcionado, devuelve una respuesta indicando que no se pudo actualizar
      res.json({ ok: false, message: 'No se encontró la campaña para actualizar el estado.' });
    } else {
      // Si se actualiza correctamente, devuelve una respuesta indicando que se actualizó el estado
      res.json({ ok: true, message: 'Estado actualizado correctamente.' });
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});
router.delete('/eliminar/:id', verifyToken, async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const id = req.params.id; // Obtén el ID del registro de los parámetros de la solicitud

    // Verificar si el registro existe y su estado es "SIN CONFIRMAR"
    const [existingRecord] = await connection.query('SELECT * FROM registro WHERE codRegistro = ? AND estado = ?', [id, 'SIN CONFIRMAR']);

    if (existingRecord.length === 0) {
      // Si no se encuentra el registro con el ID y estado correspondiente, devuelve una respuesta indicando que no se puede eliminar
      res.json({ ok: false, message: 'No se encontró el registro para eliminar o su estado no es SIN CONFIRMAR.' });
    } else {
      // Si se cumple la condición, elimina el registro
      const [result] = await connection.query('DELETE FROM registro WHERE codRegistro = ?', [id]);

      if (result.affectedRows === 0) {
        // Si no se elimina ninguna fila, devuelve una respuesta de error
        res.json({ ok: false, message: 'No se pudo eliminar el registro.' });
      } else {
        // Si se elimina correctamente, devuelve una respuesta exitosa
        res.json({ ok: true, message: 'Registro eliminado correctamente.' });
      }
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

router.post('/validar-fecha-reserva', async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const input = req.body;

    // Verificar si hay una campaña que comienza o termina dentro del rango de tiempo de la reserva
    const [existingCampaigns] = await connection.query(
     // 'SELECT * FROM registro WHERE (horainicio <= ? AND horafinal >= ? ) AND codLocalidad = ? AND fechRegistro = ?',
     // [input.txtHoraInicial, input.txtHoraInicial, input.ddlLocalidad, input.txtFecha]
     'SELECT * FROM registro WHERE ((horainicio <= ? AND horafinal >= ?) OR (horainicio <= ? AND horafinal >= ?)) AND codLocalidad = ? AND fechRegistro = ?',
      [input.txtHoraInicial, input.txtHoraInicial, input.txtHoraFinal, input.txtHoraFinal, input.ddlLocalidad, input.txtFecha]

    );

    if (existingCampaigns.length > 0) {
      // Si hay una campaña que cumple con los criterios, devolver una respuesta indicando que no se puede registrar la reserva
      res.status(400).json({ error: 'Ya hay una campaña que se superpone en el tiempo asignado.' });
    } else {
      // Si no hay campañas que cumplan con los criterios, la reserva es válida
      res.json({ ok: true });
    }

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/registrar-pago', async (req, res) => {
  try {
    const connection = await dbConnection(); // Obtén la conexión a la base de datos
    const input = req.body;

    await connection.query(
      'INSERT INTO pagos (fechaPago, metodoPago, importePago, codRegistro, codCaja) VALUES (?, ?, ?, ?, ?)',
      [input.fechaPago, input.metodoPago, input.importePago, input.codRegistro, 8 ]
    );

    res.json({ ok: true, message: 'Registro de pago exitoso' });

    connection.release(); // Libera la conexión del pool cuando hayas terminado
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor al registrar el pago' });
  }
});

// router.post('/cal-price-time',verifyToken, async (req, res) => {
router.post('/cal-price-time',  async (req, res) => {
  try {
    const { codCliente, codLocalidad, fechRegistro, horainicio, horafinal  } = req.body;
    const clienteQuery = 'SELECT * FROM Clientes WHERE codCliente = ?';
    const precioQueries = {
      CLIENTE: {
        '06:00:00-18:00:00': 'SELECT precioDia FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNoche FROM localidad WHERE codLocalidad = ?'
      },
      VECINOSURCANO: {
        '06:00:00-18:00:00': 'SELECT precioDiaSurcano FROM localidad WHERE codLocalidad = ?',
        '18:00:00-22:00:00': 'SELECT precioNocheSurcano FROM localidad WHERE codLocalidad = ?'
      }
    };

    const connection = await dbConnection();

    const [clienteResults] = await connection.query(clienteQuery, [codCliente]);

    if (clienteResults.length === 0) {
      res.status(400).json({ error: 'Usuario no encontrado' });
      return;
    }

    const cliente = clienteResults[0];
    const tipoCliente = cliente.tipo;
    const hora = horainicio;

    const horaKey = (hora >= '06:00:00' && hora < '18:00:00') ? '06:00:00-18:00:00' : '18:00:00-22:00:00';
    const precioQuery = precioQueries[tipoCliente][horaKey];

    if (!precioQuery) {
      res.status(400).json({ error: 'Tipo de cliente o horario no válido' });
      return;
    }

    const [precioResults] = await connection.query(precioQuery, [codLocalidad]);

    if (precioResults.length === 0) {
      res.status(400).json({ error: 'Localidad no encontrada' });
      return;
    }

    // const precio = precioResults[0].precioDia || precioResults[0].precioNoche || precioResults[0].precioAdultosMayor || precioResults[0].precioMenores || precioResults[0].precioVecinosSI || precioResults[0].precioVecinosVSP;
    const precio = precioResults[0].precioDia || precioResults[0].precioNoche || precioResults[0].precioDiaSurcano || precioResults[0].precioNocheSurcano;
   
    //res.json({ precio });

    connection.release();

    if (!horainicio || !horafinal || !precio) {
      res.status(400).json({ error: 'Los campos horainicio, horafinal y precio son obligatorios.' });
      return;
    }

    const fechaActual = moment().format('YYYY-MM-DD');
const horaInicioConFecha = `${fechaActual} ${horainicio}`;
const horaFinConFecha = `${fechaActual} ${horafinal}`;

const resultado = calPriceTime(horaInicioConFecha, horaFinConFecha, precio);

    res.json({  resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

function calPriceTime(horaInicio, horaFin, precioBase) {
  const fechaInicio = moment(horaInicio);
  const fechaFin = moment(horaFin);
  const duracion = fechaFin.diff(fechaInicio, 'minutes'); // Duración en minutos

  if (
    fechaInicio.hours() === 17 &&
    fechaInicio.minutes() === 0 &&
    fechaFin.hours() === 18 &&
    fechaFin.minutes() === 50
  ) {
    const resultado = parseFloat(precioBase) + 30; // Sumar 30 al precio base
    return {precioBase , resultado : resultado.toFixed(2) , duracion};
  }

  let multiplicador = 1;
  if (duracion > 55) {
    multiplicador = 2;
  } 
  if (duracion > 150) {
    multiplicador = 3;
  }
  if (duracion > 200) {
    multiplicador = 4;
  }
  if (duracion > 250) {
    multiplicador = 5;
  }
  if (duracion > 300) {
    multiplicador = 6;
  }

  const resultado = multiplicador * parseFloat(precioBase); // Multiplicar por el precio base
  return {precioBase , resultado : resultado.toFixed(2) , duracion};
}

function validateTimeAndPrice(fecha,horaInicio, horaFin,duracion,cliente){
  //const fechaActual = moment().format('YYYY-MM-DD');
  const horaInicioConFecha = `${fecha} ${horaInicio}`;
  const horaFinConFecha = `${fecha} ${horaFin}`;
  const fechaInicio = moment(horaInicioConFecha);
  const fechaFin = moment(horaFinConFecha);
  const duracionReal = fechaFin.diff(fechaInicio, 'minutes');
  //var texto = '50 minuto(s)';
var numero = parseInt(duracion.replace(/\D/g, ''), 10);
if(duracionReal == numero){
  return true
}else{
  console.log(`error en hora de inicio ${fechaInicio} y hora de fin ${fechaFin} no coincide con la hora real ${duracionReal} con la proporcionada ${numero} cliente ${cliente}`)
  return false
}
}

module.exports = router;
