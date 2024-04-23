const Router = require("express");
const { addCategory, getAllCategory, getCategory } = require("../controllers/categoryController");

const categoryRouter = Router();

// authRouter.get("/test", (_req, res) => {
//   res.send("Hello");
// });
categoryRouter.get("/list", getAllCategory)
categoryRouter.get("/byId", getCategory)
categoryRouter.post("/add", addCategory)




module.exports = categoryRouter;
