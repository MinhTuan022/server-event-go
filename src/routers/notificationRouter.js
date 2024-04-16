const Router = require("express")
const {getNotification} = require("../controllers/notificationController")
const notificationRouter = Router();

notificationRouter.get("/", getNotification)

module.exports = notificationRouter