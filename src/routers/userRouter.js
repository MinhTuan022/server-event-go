const Router = require("express");
const {getAllUser, getUserById} = require("../controllers/userControllers")
const userRouter = Router();



userRouter.get("/", getAllUser)
userRouter.get("/:userId", getUserById)


module.exports = userRouter