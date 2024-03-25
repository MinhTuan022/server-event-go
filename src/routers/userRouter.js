const Router = require("express");
const {getAllUser, getUserById, handleFollow} = require("../controllers/userControllers")
const userRouter = Router();



userRouter.get("/", getAllUser)
userRouter.get("/userId", getUserById)
userRouter.post("/follow", handleFollow)


module.exports = userRouter