const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');


const options = {
    
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Authentication',
      version: '1.0.0',
        description: 'Documentation for the API Authentication service',
    },
    },
    apis: [path.resolve(__dirname, '../controllers/AuthController.js')],

};

const specs = swaggerJsdoc(options);

module.exports = specs;
