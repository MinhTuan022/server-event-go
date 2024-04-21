const Router = require("express");
const { createOrder, getOrder, deleteOrder, updateStatusCompleted, countOrdersPerHour, countSoldTicket, getRevenue, countCancelledPerHour } = require("../controllers/orderController");

const orderRouter = Router();

orderRouter.post("/", createOrder)
orderRouter.get("/", getOrder)

orderRouter.delete("/delete", deleteOrder)
orderRouter.put("/complete", updateStatusCompleted)
orderRouter.get("/statis", countOrdersPerHour)
orderRouter.get("/sold",countSoldTicket)
orderRouter.get("/revenue", getRevenue)
orderRouter.get("/cancelled", countCancelledPerHour)

module.exports= orderRouter