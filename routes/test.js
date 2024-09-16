//GET ALL USER
const router = require("express").Router()
const connection = require('../core/db_config');

router.get("/",async(req,res)=>{
    //res.status(200).json("Hello get test")  
    try {
        const query = `
          SELECT *
          FROM message_schedules
          WHERE process_date = CURRENT_DATE
          AND process_hour <= CURRENT_TIME
          #AND process_status NOT IN (1,2,3)
          ORDER BY process_hour;
        `;
    
        connection.query(query, (error, results, fields) => {
          if (error) {
            console.error('Error al ejecutar la consulta: ', error);
            res.status(500).json({ error: 'Error al ejecutar la consulta' });
          } else {
            res.status(200).json(results);
          }
        });
      } catch (error) {
        console.error('Error al procesar la solicitud: ', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
      }
})


module.exports = router