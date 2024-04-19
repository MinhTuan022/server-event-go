const Router = require("express")
const {getNotification, updateIsRead, checkUnreadNotifications} = require("../controllers/notificationController")
const notificationRouter = Router();

notificationRouter.get("/", getNotification)
notificationRouter.put("/isRead", updateIsRead)
notificationRouter.get("/check", checkUnreadNotifications)

module.exports = notificationRouter