const express = require('express');
const router = express.Router();
const Hex = require('crypto-js/enc-hex')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const dbConnection = require('../core/db_config');
const moment = require('moment');

router.post('/',async (req,res) =>{
    try {
          const { 'kr-hash': krHash, 'kr-hash-algorithm': krHashAlgorithm, 'kr-answer': krAnswer, 'kr-answer-type': krAnswerType } = req.body;
          const connection = await dbConnection();          
          let hmac;
          if (process.env.MODE === "TEST") {
            hmac = process.env.IZIPAY_PASSPORD_TEST;
          } else {
            hmac = process.env.IZIPAY_PASSPORD;
          }
          if (verifyHash(krHash, krHashAlgorithm, krAnswer, hmac)) {
            const answer = JSON.parse(krAnswer);
            const id = answer.orderDetails.orderId;
            const [existingRecord] = await connection.query('SELECT * FROM registro WHERE venta_id = ? AND estado = ?', [id, 'SIN CONFIRMAR']);
            if (existingRecord.length === 0) {
                console.error("No se encontró la venta ", id ," para validar o su estado no es SIN CONFIRMAR. ")
                res.json({ ok: false, message: 'No se encontró el registro para eliminar o su estado no es SIN CONFIRMAR.' });
            return
            }
            const fechaPago = existingRecord[0].created_at
            const importePago = existingRecord[0].costoTarifa
            const codRegistro = existingRecord[0].codRegistro
            if (answer.orderStatus === 'PAID') {
                const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                const [result] = await connection.query('UPDATE registro SET estado = ?, updated_at = ? WHERE codRegistro = ?', ['CONFIRMADO', updatedAt, codRegistro]);
                if (result.affectedRows === 0) {
                    console.error('No se encontró la venta.',codRegistro)
                  res.json({ ok: false, message: 'No se encontró la venta.',codRegistro });
                } else {
                    let [getPago] = await connection.query("select * from pagos where codRegistro = ? ",[codRegistro])
                    if(getPago.length === 0){
                        let [updatePago] = await connection.query('INSERT INTO pagos (fechaPago, metodoPago, importePago, codRegistro, codCaja) VALUES (?, ?, ?, ?, ?)', [fechaPago, 'PASARELA DE PAGO', importePago, codRegistro, 8 ]);
                        if (updatePago.affectedRows === 0) {
                          console.error('No se creo el pago del registro', codRegistro)
                          res.json({ ok: false, message: 'No se creo el pago del registro', codRegistro });
                        } else {
                          console.log('Estado actualizado correctamente el registro',codRegistro)
                          res.json({ ok: true, message: 'Estado actualizado correctamente.' });
                        }
                    }else{
                        console.error("el pago ",codRegistro," ya fue registrado")
                        res.json({ ok: false, message: `el pago ${codRegistro} ya fue registrado` });
                    }
                    
                }

            } else if (answer.orderStatus === 'UNPAID') {

              const [result] = await connection.query('DELETE FROM registro WHERE codRegistro = ? AND estado = "SIN CONFIRMAR"', [codRegistro]);
              if (result.affectedRows === 0) {
                console.error('No se pudo eliminar el registro.', codRegistro)
                res.json({ ok: false, message: 'No se pudo eliminar el registro.', codRegistro });
              } else {
                console.log('Registro eliminado correctamente.',codRegistro)
                res.json({ ok: true, message: 'Registro eliminado correctamente.',codRegistro });
              }
            }
          } else {
            console.error('Firma inválida');
            res.status(400).send('Firma inválida');
          }
          connection.release();
    } catch (error) {
        console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });

    }
})

function verifyHash(krHash, krHashAlgorithm, krAnswer, secretKey) {
    if (krHashAlgorithm !== 'sha256_hmac') {
      return false;
    }
  
    const hash = Hex.stringify(
      hmacSHA256(krAnswer.replace(/\\\//g, '/'), secretKey)
    );
  
    return hash === krHash;
  }

module.exports = router;