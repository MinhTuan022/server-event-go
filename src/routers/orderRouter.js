const Router = require("express");
const { createOrder, getOrder, deleteOrder, updateStatusCompleted } = require("../controllers/orderController");

const orderRouter = Router();

orderRouter.post("/", createOrder)
orderRouter.get("/", getOrder)

orderRouter.delete("/delete", deleteOrder)
orderRouter.put("/complete", updateStatusCompleted)
module.exports= orderRouter