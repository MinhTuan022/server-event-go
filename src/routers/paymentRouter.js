const Router = require("express");
const {paypalSuccess, paymentCancel, paymentRefund, getPayment, createVnPay, vnPaySuccess, createPayPal } = require("../controllers/paymentController");

const paymentRouter = Router();



paymentRouter.post("/paypal", createPayPal)
paymentRouter.get("/paypal-success", paypalSuccess)
paymentRouter.get("/cancel", paymentCancel)
paymentRouter.post("/payment-refund", paymentRefund)
paymentRouter.get("/order", getPayment)
paymentRouter.post("/vnpay", createVnPay)
paymentRouter.get("/vnpay-success", vnPaySuccess)




module.exports = paymentRouter