const Router = require("express");
const { getOrganizerById, updateProfileOgz } = require("../controllers/organizerController");

const organizerRouter = Router();

organizerRouter.get("/byId", getOrganizerById)
organizerRouter.put("/profile-ogz", updateProfileOgz)


module.exports = organizerRouter