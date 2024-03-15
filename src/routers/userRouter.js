const Router = require("express");
const {getAllUser} = require("../controllers/userControllers")
const userRouter = Router();



userRouter.get("/", getAllUser)


module.exports = userRouter