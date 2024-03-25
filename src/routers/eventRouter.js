const Router = require("express");
const {addEvent, getEventById, getAllEvent, getGoing} = require("../controllers/eventController")
const eventRouter = Router();



eventRouter.post("/add", addEvent);
eventRouter.get("/byId/:eventId", getEventById);
eventRouter.get("/", getAllEvent);
eventRouter.get("/going", getGoing)
module.exports = eventRouter