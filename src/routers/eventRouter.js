const Router = require("express");
const {addEvent, getEventById, getEvent, getGoing} = require("../controllers/eventController")
const eventRouter = Router();



eventRouter.post("/add", addEvent);
eventRouter.get("/byId/:eventId", getEventById);
eventRouter.get("/", getEvent);
eventRouter.get("/going", getGoing)
module.exports = eventRouter