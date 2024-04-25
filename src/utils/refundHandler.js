const paypal = require("paypal-rest-sdk");
const axios = require("axios");
const qs = require("qs");
const {
  handleSendNotification,
  sendPushNotification,
} = require("../utils/notificationHandler");
const moment = require("moment");
const OrderModel = require("../models/OrderModel");
const EventModel = require("../models/EventModel");
const NotificatioModel = require("../models/NotificationModel");
const PaymentModel = require("../models/PaymentModel");
const TicketModel = require("../models/TicketModel");
const UserModel = require("../models/UserModel");
const paymentRefund = async (orderId) => {
  const payment = await PaymentModel.findOne({ orderId });
  if (payment) {
    const order = await OrderModel.findById(orderId);
    if (payment.paymentMethod === "PayPal") {
      const refundRequest = {
        amount: {
          total: payment.amount,
          currency: "USD",
        },
      };

      paypal.sale.refund(
        payment.transactionId,
        refundRequest,
        async (error, refund) => {
          if (error) {
            return { status: 500, message: "Failed to process refund." };
          } else {
            try {
              await PaymentModel.findByIdAndDelete(payment._id);

              return { status: 200, message: "Refund successful." };
            } catch (error) {
              return res.status(500).json({ message: "Fail" });
            }
          }
        }
      );
    } else {
      process.env.TZ = "Asia/Ho_Chi_Minh";
      let date = new Date();
      let transactionDate = moment(date).format("YYYYMMDDHHmmss");
      let createDate = "20240419183724";

      let crypto = require("crypto");

      let vnp_TmnCode = "QVC4CD2K";
      let secretKey = "PYKEWBFCKXHOLEJQUQENYZDXZXPHWLRY";
      let vnp_Api =
        "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

      let vnp_TxnRef = orderId;
      let vnp_TransactionDate = createDate;
      let vnp_Amount = order.totalPrice * 100;
      let vnp_TransactionType = "02";
      let vnp_CreateBy = "Tuan";

      let currCode = "VND";

      let vnp_RequestId = moment(date).format("HHmmss");
      let vnp_Version = "2.1.0";
      let vnp_Command = "refund";
      let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

      let vnp_IpAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

      let vnp_TransactionNo = payment.transactionId;

      let data =
        vnp_RequestId +
        "|" +
        vnp_Version +
        "|" +
        vnp_Command +
        "|" +
        vnp_TmnCode +
        "|" +
        vnp_TransactionType +
        "|" +
        vnp_TxnRef +
        "|" +
        vnp_Amount +
        "|" +
        vnp_TransactionNo +
        "|" +
        vnp_TransactionDate +
        "|" +
        vnp_CreateBy +
        "|" +
        vnp_CreateDate +
        "|" +
        vnp_IpAddr +
        "|" +
        vnp_OrderInfo;
      // console.log(data);
      let hmac = crypto.createHmac("sha512", secretKey);
      // console.log(hmac);
      let vnp_SecureHash = hmac
        .update(Buffer.from(data, "utf-8"))
        .digest("hex");

      let dataObj = {
        vnp_RequestId: vnp_RequestId,
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TransactionType: vnp_TransactionType,
        vnp_TxnRef: vnp_TxnRef,
        vnp_Amount: vnp_Amount,
        vnp_TransactionNo: vnp_TransactionNo,
        vnp_CreateBy: vnp_CreateBy,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_TransactionDate: vnp_TransactionDate,
        vnp_CreateDate: vnp_CreateDate,
        vnp_IpAddr: vnp_IpAddr,
        vnp_SecureHash: vnp_SecureHash,
      };
      return { status: 200, message: "Refund successful." };
    }
  } else {
    return { status: 200, message: "Payment Not Found." };
  }
};

module.exports = { paymentRefund };
