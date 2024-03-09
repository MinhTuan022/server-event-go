const Router = require("express");
const { register, login, verification, forgotPassword, loginSocial } = require("../controllers/authController");

const authRouter = Router();

// authRouter.get("/test", (_req, res) => {
//   res.send("Hello");
// });


authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verification", verification)
authRouter.post("/forgotPassword", forgotPassword)
authRouter.post("/login-social", loginSocial)

module.exports = authRouter;
