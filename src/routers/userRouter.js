const Router = require("express");
const {
  getAllUser,
  getUserById,
  handleFollow,
  checkFollowingStatus,
  getFollowers,
  getFavorites,
  handleFavorite,
  updateProfile,
  checkFriend,
  checkRelationship,
  getFriend,
  updateFcmToken,
  sendNotification,
  deleteFcmToken,
  getFollowings,
} = require("../controllers/userControllers");
const userRouter = Router();

userRouter.get("/", getAllUser);
userRouter.get("/userId", getUserById);
userRouter.get("/check-following", checkFollowingStatus);
userRouter.post("/follow", handleFollow);
userRouter.get("/followers", getFollowers);
userRouter.get("/favorites", getFavorites);
userRouter.post("/favorite", handleFavorite);
userRouter.put("/profile", updateProfile);
userRouter.get("/check-relationship", checkRelationship);
userRouter.get("/friend", getFriend);
userRouter.post("/update-fcmtoken", updateFcmToken);
userRouter.post("/send-notification", sendNotification)
userRouter.delete("/delete-fcmToken", deleteFcmToken)
userRouter.get('/following', getFollowings)

module.exports = userRouter;
