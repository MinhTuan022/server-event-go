const paypal = require("paypal-rest-sdk");
const axios = require("axios");
const qs = require("qs");
const {
  handleSendNotification,
  sendPushNotification,
} = require("../utils/notificationHandler");

const OrderModel = require("../models/OrderModel");
const EventModel = require("../models/EventModel");
const NotificatioModel = require("../models/NotificationModel");
const PaymentModel = require("../models/PaymentModel");
const TicketModel = require("../models/TicketModel");
const UserModel = require("../models/UserModel");
const createPayment = async (req, res) => {
  const { name, price, quantity, orderId } = req.body;
  console.log(req.body);
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://192.168.1.106:3001/paypal/success",
      cancel_url: "http://192.168.1.106:3001/paypal/cancel",
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

const paymentSuccess = async (req, res) => {
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
        return res.redirect("/paypal/cancel");
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

  // Truy xuất thông tin đơn hàng
  const order = await OrderModel.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  if (order.status === "Paid") {
    const payment = await PaymentModel.findOne({ orderId: orderId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

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

            await handleSendNotification(
              "d_tvr6cWQhC0UOou4eZ536:APA91bGmUJ0ZWOgChiUV3SDj8tRu6Uvov22X97YUc21DcInnGZ7ewKRMy_fImUOV-CCXaFaXitYP0HdVGhNtmTpz22U1yYHinMOCqiADtUkgxm75gSzi6M86P8153lJBBFWQ5t78uNQ4",
              "Refund Successful",
              "Your refund has been processed successfully.",
              { id: order.userId }
            );

            return res.status(200).json({ message: "success" });
          } catch (error) {
            return res.status(500).json({ message: "Fail" });
          }
        }
      }
    );
  } else {
    return res.status(200).json({ message: "success" });
  }
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

    if(!payment){
      return res.status(400).json("Không có thông tin thanh toán")
    }

    res.status(200).json({message:"thành công", data: payment})
  } catch (error) {
    res.status(500).json({message: "Lỗi"})
  }
};

module.exports = {
  createPayment,
  paymentCancel,
  paymentSuccess,
  paymentRefund,
  getPayment
};
