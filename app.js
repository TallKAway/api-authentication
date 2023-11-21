require('dotenv').config();

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const route = require("./routes");
const http = require('http');
const swaggerUi = require('swagger-ui-express');

const authRouter = require('./routes/auth.routes');

const middlewares = require('./middlewares/auth');
const swaggerSpec = require('./docs/swaggerConfig');

const PORT = process.env.PORT || 3008;
const api = express();
dotenv.config();
api.use(express.json());
api.use(cors({
  origin: '*'
}));

    api.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const meta = {
    Port: PORT
};


route(api);

api.use(middlewares.errorHandler);


const ads = [{msg: `TallAway Authentification api is running on Port: ${PORT}`}];

api.get('/', (req, res) => {
    res.send(ads);
});

api.listen(PORT).setTimeout(50000);

// discordLogger.warn('Roomee Authentification Service is running', {meta});
console.info(`Listening on port ${PORT}`);
module.exports = api
