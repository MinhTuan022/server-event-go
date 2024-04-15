const Router = require("express");
const { createPayment, paymentSuccess, paymentCancel, paymentRefund } = require("../controllers/paymentController");

const paymentRouter = Router();



paymentRouter.post("/", createPayment)
paymentRouter.get("/success", paymentSuccess)
paymentRouter.get("/cancel", paymentCancel)
paymentRouter.post("/refund", paymentRefund)




module.exports = paymentRouter