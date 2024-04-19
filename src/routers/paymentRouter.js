const Router = require("express");
const { createPayment, paymentSuccess, paymentCancel, paymentRefund, getPayment } = require("../controllers/paymentController");

const paymentRouter = Router();



paymentRouter.post("/", createPayment)
paymentRouter.get("/success", paymentSuccess)
paymentRouter.get("/cancel", paymentCancel)
paymentRouter.post("/refund", paymentRefund)
paymentRouter.get("/order", getPayment)




module.exports = paymentRouter