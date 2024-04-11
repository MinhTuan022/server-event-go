const Router = require("express");
const {addEvent, getEventById, getEvent, getGoing, getFavoriteOfUser} = require("../controllers/eventController")
const eventRouter = Router();



eventRouter.post("/add", addEvent);
eventRouter.get("/byId/:eventId", getEventById);
eventRouter.get("/", getEvent);
eventRouter.get("/going", getGoing)
eventRouter.get("/favorite", getFavoriteOfUser)
module.exports = eventRouter