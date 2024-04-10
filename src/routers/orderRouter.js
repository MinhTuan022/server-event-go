const Router = require("express");
const { createOrder, getOrder } = require("../controllers/orderController");

const orderRouter = Router();

orderRouter.post("/", createOrder)
orderRouter.get("/", getOrder)


module.exports= orderRouter