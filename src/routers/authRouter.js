const Router = require("express");
const { register, login, verification, forgotPassword, loginSocial, checkUser, registerOrganizer } = require("../controllers/authController");

const authRouter = Router();

// authRouter.get("/test", (_req, res) => {
//   res.send("Hello");
// });


authRouter.post("/register", register);
authRouter.post("/register-organizer", registerOrganizer);

authRouter.post("/login", login);
authRouter.post("/verification", verification)
authRouter.post("/forgotPassword", forgotPassword)
authRouter.post("/login-social", loginSocial)
authRouter.get("/check-user",checkUser)

module.exports = authRouter;
