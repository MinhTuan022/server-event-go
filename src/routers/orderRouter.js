const Router = require("express");
const { createOrder, getOrder, deleteOrder } = require("../controllers/orderController");

const orderRouter = Router();

orderRouter.post("/", createOrder)
orderRouter.get("/", getOrder)

orderRouter.delete("/delete", deleteOrder)
module.exports= orderRouter