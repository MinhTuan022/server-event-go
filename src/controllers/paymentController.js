const paypal = require("paypal-rest-sdk");
const OrderModel = require("../models/OrderModel");
const EventModel = require("../models/EventModel");
const PaymentModel = require("../models/PaymentModel");
const TicketModel = require("../models/TicketModel");
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
          console.log(payment)
          // Trích xuất thông tin về vé đã mua
          const orderId = payment.transactions[0].description.split('#')[1];
          const quantity = payment.transactions[0].item_list.items[0].quantity;

          // Cập nhật trạng thái của đơn hàng thành "Đã thanh toán"
          const order = await OrderModel.findByIdAndUpdate(
            orderId,
            { status: "Paid" },
            { new: true }
          );

          // Cập nhật số lượng còn lại của vé trong cơ sở dữ liệu
          const ticket = await TicketModel.findById(order.ticketId);

          if (!ticket) {
            // Không tìm thấy vé trong cơ sở dữ liệu
            return res.status(404).json({ message: "Ticket not found." });
          }
          
          // Kiểm tra số lượng vé còn lại trong kho
          if (ticket.quantity < quantity) {
            // Số lượng vé được mua lớn hơn số lượng vé còn lại trong kho
            return res.status(400).json({ message: "Not enough tickets available." });
          }
          
          // Cập nhật số lượng vé trong kho
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
            transactionId: payment.id,
          });
          await newPayment.save();

          // Trả về thông tin vé và đơn hàng cho người dùng
          // ...
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

module.exports = {
  createPayment,
  paymentCancel,
  paymentSuccess,
};
