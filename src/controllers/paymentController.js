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
const createPayPal = async (req, res) => {
  const { name, price, quantity, orderId } = req.body;
  console.log(req.body);
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://192.168.1.106:3001/payment/paypal-success",
      cancel_url: "http://192.168.1.106:3001/payment/cancel",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: name,
              price: price,
              currency: "USD",
              quantity: quantity,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: price * quantity,
        },
        description: "Payment for Order #" + orderId,
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          console.log(payment);
          // res.redirect(payment.links[i].href);
          return res
            .status(200)
            .json({ message: "Success", data: payment.links[i].href });
        }
      }
    }
  });
};

const paypalSuccess = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async function (error, payment) {
      if (error) {
        console.error(JSON.stringify(error));
        return res.redirect("/payment/cancel");
      } else {
        try {
          console.log(payment);

          const transactionId = await getTransactionDetails(paymentId);
          // Trích xuất thông tin về vé đã mua
          const orderId = payment.transactions[0].description.split("#")[1];
          const quantity = payment.transactions[0].item_list.items[0].quantity;

          const order = await OrderModel.findByIdAndUpdate(
            orderId,
            { status: "Paid" },
            { new: true }
          );

          const ticket = await TicketModel.findById(order.ticketId);

          if (!ticket) {
            return res.status(404).json({ message: "Ticket not found." });
          }
          if (ticket.quantity < quantity) {
            return res
              .status(400)
              .json({ message: "Not enough tickets available." });
          }

          const updatedTicket = await TicketModel.findByIdAndUpdate(
            order.ticketId,
            { $inc: { quantity: -quantity } },
            { new: true }
          );

          // Lưu thông tin thanh toán vào PaymentModel
          const newPayment = new PaymentModel({
            orderId: orderId,
            paymentMethod: "PayPal",
            amount: payment.transactions[0].amount.total,
            transactionId: transactionId,
          });
          await newPayment.save();

          const user = await UserModel.findById(order.userId);
          sendPushNotification(
            user.fcmTokens,
            "Thanh Toán Thành Công",
            "Đơn hàng của bạn đã thanh toán thành công"
          );

          const newNoti = new NotificatioModel({
            userId: order.userId,
            body: "Đơn hàng của bạn đã thanh toán thành công",
            title: "Thanh Toán Thành Công",
            type: "payment-success",
          });

          await newNoti.save();
          return res.status(200).json({ message: "success" });
        } catch (error) {
          console.error(error);
          return res.status(400).json({ message: "Error processing payment." });
        }
      }
    }
  );
};

const paymentCancel = async (req, res) => {
  res.send("Cancel");
};

const paymentRefund = async (req, res) => {
  const { orderId } = req.body;
  const payment = await PaymentModel.findOne({ orderId });
  if (!payment) {
    return res.status(404).json({ message: "Payment not found." });
  }
  const order = await OrderModel.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

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
          console.log(error);
        } else {
          try {
            await PaymentModel.findByIdAndDelete(payment._id);

            const user = await UserModel.findById(order.userId);
            sendPushNotification(
              user.fcmTokens,
              "Vé của bạn đã được hủy, số tiền thanh toán sẽ được hoàn lại",
              "Hủy vé thành công"
            );
            const event = await EventModel.findById(order.eventId);
            const newNoti = new NotificatioModel({
              userId: order.userId,
              body: `Bạn đã hủy vé sự kiện ${event.title}, số tiền thanh toán sẽ được hoàn lại`,
              title: "Hủy vé thành công",
              type: "ticket",
            });
            await newNoti.save();

            return res.status(200).json({ message: "success" });
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

    console.log(createDate);
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
    let vnp_SecureHash = hmac.update(Buffer.from(data, "utf-8")).digest("hex");

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
    console.log(dataObj);
    axios
      .post(vnp_Api, dataObj)
      .then((response) => {
        console.log("d", response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Truy xuất thông tin đơn hàng

  // if (order.status === "Paid") {
  //   const payment = await PaymentModel.findOne({ orderId: orderId });
  //   if (!payment) {
  //     return res.status(404).json({ message: "Payment not found." });
  //   }
  // } else {
  //   return res.status(200).json({ message: "success" });
  // }
};
const getAccessTokenPaypal = async () => {
  try {
    const base64encoded = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");
    const data = qs.stringify({
      grant_type: "client_credentials",
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64encoded}`,
      },
      data: data,
    };

    const response = await axios.request(config);
    return response.data.access_token;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getTransactionDetails = async (paymentId) => {
  try {
    const accessToken = await getAccessTokenPaypal();
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api.sandbox.paypal.com/v1/payments/payment/${paymentId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await axios.request(config);
    return response.data.transactions[0].related_resources[0].sale.id;
    console.log(
      JSON.stringify(response.data.transactions[0].related_resources[0].sale.id)
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};
const getPayment = async (req, res) => {
  try {
    const { orderId } = req.query;
    const payment = await PaymentModel.findOne({ orderId });

    if (!payment) {
      return res.status(400).json("Không có thông tin thanh toán");
    }

    res.status(200).json({ message: "thành công", data: payment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};

const createVnPay = async (req, res) => {
  const { name, price, quantity, orderId } = req.body;
  process.env.TZ = "Asia/Ho_Chi_Minh";

  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = "QVC4CD2K";
  let secretKey = "PYKEWBFCKXHOLEJQUQENYZDXZXPHWLRY";
  let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  let returnUrl = "http://192.168.1.106:3001/payment/vnpay-success";
  let amount = price * quantity;
  let bankCode = "VNBANK";
  let locale = "vn";
  let currCode = "VND";

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);
  let signData = qs.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  console.log(vnp_Params);
  vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });
  res.status(200).json({ message: "Thành công", data: vnpUrl });
};
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const vnPaySuccess = async (req, res) => {
  try {
    // console.log(req.query);
    const orderId = req.query.vnp_TxnRef;
    const transactionId = req.query.vnp_TransactionNo;

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { status: "Paid" },
      { new: true }
    );
    const quantity = order.quantity;
    const ticket = await TicketModel.findById(order.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }
    if (ticket.quantity < quantity) {
      return res.status(400).json({ message: "Not enough tickets available." });
    }

    const updatedTicket = await TicketModel.findByIdAndUpdate(
      order.ticketId,
      { $inc: { quantity: -quantity } },
      { new: true }
    );

    // Lưu thông tin thanh toán vào PaymentModel
    const newPayment = new PaymentModel({
      orderId: orderId,
      paymentMethod: "VnPay",
      amount: order.totalPrice,
      transactionId: transactionId,
    });
    await newPayment.save();

    const user = await UserModel.findById(order.userId);
    sendPushNotification(
      user.fcmTokens,
      "Thanh Toán Thành Công",
      "Đơn hàng của bạn đã thanh toán thành công"
    );

    const newNoti = new NotificatioModel({
      userId: order.userId,
      body: "Đơn hàng của bạn đã thanh toán thành công",
      title: "Thanh Toán Thành Công",
      type: "payment-success",
    });

    await newNoti.save();
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Error processing payment." });
  }
};

module.exports = {
  createPayPal,
  paymentCancel,
  paypalSuccess,
  paymentRefund,
  getPayment,
  createVnPay,
  vnPaySuccess,
};
