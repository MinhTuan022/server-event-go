const Router = require("express");
const {addEvent, getEventById, getAllEvent} = require("../controllers/eventController")
const eventRouter = Router();



eventRouter.post("/add", addEvent);
eventRouter.get("/byId", getEventById);
eventRouter.get("/", getAllEvent);

module.exports = eventRouter