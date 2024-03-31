const Router = require("express");
const {getAllUser, getUserById, handleFollow, checkFollowingStatus, getFollowers, getFavorites} = require("../controllers/userControllers")
const userRouter = Router();



userRouter.get("/", getAllUser)
userRouter.get("/userId", getUserById)
userRouter.get("/check-following", checkFollowingStatus)
userRouter.post("/follow", handleFollow)
userRouter.get("/followers", getFollowers)
userRouter.get("/favorites", getFavorites)

module.exports = userRouter