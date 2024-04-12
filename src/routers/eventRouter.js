const Router = require("express");
const {addEvent, getEventById, getEvent, getGoing, getFavoriteOfUser, getEventByOrganizer} = require("../controllers/eventController")
const eventRouter = Router();



eventRouter.post("/add", addEvent);
eventRouter.get("/byId", getEventById);
eventRouter.get("/byOrganizer", getEventByOrganizer);

eventRouter.get("/", getEvent);
eventRouter.get("/going", getGoing)
eventRouter.get("/favorite", getFavoriteOfUser)
module.exports = eventRouter