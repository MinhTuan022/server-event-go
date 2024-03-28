const Router = require("express");
const { createPayment, paymentSuccess, paymentCancel } = require("../controllers/paymentController");

const paymentRouter = Router();



paymentRouter.post("/", createPayment)
paymentRouter.get("/success", paymentSuccess)
paymentRouter.get("/cancel", paymentCancel)




module.exports = paymentRouter