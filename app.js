require('dotenv').config();

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const route = require("./routes");
const http = require('http');

const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const middlewares = require('./middlewares/auth');

const PORT = process.env.PORT || 3008;
const api = express();
dotenv.config();
api.use(express.json());
api.use(cors({
  origin: '*'
}));

    

const meta = {
    Port: PORT
};


route(api);

api.use(middlewares.errorHandler);


const ads = [{msg: `TallAway Authentification api is running on Port: ${PORT}`}];

api.get('/', (req, res) => {
    res.send(ads);
});

http.createServer(api).listen(PORT).setTimeout(50000);

// discordLogger.warn('Roomee Authentification Service is running', {meta});
console.info(`Listening on port ${PORT}`);
module.exports = api
