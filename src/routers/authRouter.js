const Router = require("express");
const { register, login, verification } = require("../controllers/authController");

const authRouter = Router();

// authRouter.get("/test", (_req, res) => {
//   res.send("Hello");
// });


authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verification", verification)

module.exports = authRouter;
