const Router = require("express");
const { register, login, verification, forgotPassword, loginSocial, checkUser, registerOrganizer, resetPassword,deleteFcmToken, changePassword, checkLinked } = require("../controllers/authController");

const authRouter = Router();

// authRouter.get("/test", (_req, res) => {
//   res.send("Hello");
// });


authRouter.post("/register", register);
authRouter.post("/register-organizer", registerOrganizer);

authRouter.post("/login", login);
authRouter.post("/verification", verification)
authRouter.post("/forgotPassword", forgotPassword)
authRouter.post("/resetPassword", resetPassword)
authRouter.post("/changePassword", changePassword)

authRouter.delete("/delete-fcmToken", deleteFcmToken)

authRouter.post("/login-social", loginSocial)
authRouter.get("/check-user",checkUser)
authRouter.get("/check-linked",checkLinked)


module.exports = authRouter;
