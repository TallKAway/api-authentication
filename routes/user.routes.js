const { Router } = require("express");
const UserController = require("../controllers/UserController");
const { isAuthenticated } = require('../middlewares/auth');

const route = Router();

route.get("/profile", isAuthenticated, UserController.Profile);
route.post("/checkPassword", isAuthenticated, UserController.CheckUserPassword);
route.post("/sentreset/email", UserController.SendResetEmail);
route.post("/check/reset/code", UserController.CheckUserResetCode);
route.post("/change/Password/by/admin", isAuthenticated, UserController.ChangePasswordByAdmin);
route.put("/changePassword", isAuthenticated, UserController.ChangePasswordInApp);
route.put("/change/Password", UserController.ChangePassword);

route.post("/reset_password/request", UserController.RequestResetPassword);
route.post("/reset_password/request/check", UserController.CheckRequestResetPassword);
module.exports = route;