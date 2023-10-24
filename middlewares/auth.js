const jwt = require('jsonwebtoken');
const {decrypt} = require('../utils/encryption')
function notFound(req, res, next) {
    res.status(404);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
}

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
    /* eslint-enable no-unused-vars */
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        msg: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
}

function isAuthenticated(req, res, next) {
    const { authorization } = req.headers;

    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        console.log(`Request from : ${fullUrl}`);

    if (!authorization) {
        console.log(`No valid authorization header : ${authorization}`);
        res.status(401).json({error: '🚫 Un-Authorized 🚫'});

        // throw new Error('🚫 Un-Authorized 🚫');
    }

    try {
        if(authorization){
            const token = authorization.split(' ')[1];
            const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            payload.usrData = decrypt(payload.usrData)
            req.payload = payload;
        }
        // return res.status(401).json({ error : '🚫 Un-Authorized 🚫', errorStack: ""});
    } catch (err) {
if(err.name === 'TokenExpiredError')
    return res.status(401).json({ error: err.name })

        console.log(err);
        return res.status(401).json({ error : '🚫 Un-Authorized 🚫', errorStack: err});



        // res.status(401);
        // if (err.name === 'TokenExpiredError') {
        //     return ({ error : err.name});
        // }
        // return ({ error : '🚫 Un-Authorized 🚫'});
    }

    return next();
}
function isValidatedPasswordToken(token) {
    const jwtToken = decrypt(token)
    try {
        const payload = jwt.verify(jwtToken, process.env.JWT_ACCESS_SECRET);
        return payload
    } catch (err) {
        console.log(err.name)
        if (err.name === 'TokenExpiredError') {
            return ({ error : 'Le token est expiré.'});
        }
        return ({ error : 'Token invalide.'});
    }
}

module.exports = {
    notFound,
    errorHandler,
    isAuthenticated,
    isValidatedPasswordToken
};
