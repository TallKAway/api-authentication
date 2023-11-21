const authRouter = require('./routes/auth.routes');



module.exports = (app) => { 
    app.use('/', authRouter);

};
