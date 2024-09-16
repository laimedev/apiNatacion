const swaggerJsDoc = require('swagger-jsdoc');

// Opciones para configurar Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'APIS TEMUSS',
      version: '1.0.0',
      description: 'Teatro Municipal de Santiago de Surco - EMUSSSA SA.',
    },
    servers: [
      {
        url: process.env.BACKEND, // Cambia esta URL según tu entorno
      },
    ],
  },
  apis: ['./docs/*.yaml'],  // Ruta donde se encuentran tus archivos YAML de documentación
};

// Genera la documentación de Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = swaggerDocs;
