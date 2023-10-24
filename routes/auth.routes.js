const { Router } = require("express");
const AuthController = require("../controllers/AuthController");
// const { isAuthenticated } = require("../middlewares/auth");

const route = Router();

route.get("/test", AuthController.Test);
route.post("/register", AuthController.Register);
route.post("/login/:type?", AuthController.Login);
route.post("/refreshToken", AuthController.RefreshToken);
route.post("/revokeRefreshTokens", AuthController.RevokeRefreshTokens);

module.exports = route;
