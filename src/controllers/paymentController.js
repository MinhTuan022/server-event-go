const express = require("express");
const paypal = require("paypal-rest-sdk");

const createPayment = async (req, res) => {
  const {name, price, quantity} = req.body
  console.log(req.body)
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
          total: price*quantity,
        },
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
  res.send("Success");

  // const payerId = req.query.PayerID;
  // const paymentId = req.query.paymentId;

  // const execute_payment_json = {
  //   payer_id: payerId,
  // };

  // paypal.payment.execute(paymentId, execute_payment_json, function (
  //   error,
  //   payment
  // ) {
  //   if (error) {
  //     console.error(JSON.stringify(error));
  //     return res.redirect("/paypal/cancel");
  //   } else {
  //     // Return ticket information to the user upon successful payment
  //     const ticketInfo = {
  //       id:payerId,
  //       ticketNumber: payment.id,
  //       itemName: payment.transactions[0].item_list.items[0].name,
  //       totalPrice: payment.transactions[0].amount.total,
  //       currency: payment.transactions[0].amount.currency,
  //       description: payment.transactions[0].description,
  //     };
  //     return res.status(200).json({ message: "Success", data: ticketInfo });
  //   }
  // });
};

const paymentCancel = async (req, res) => {
  res.send("Cancel");
};

module.exports = {
  createPayment,
  paymentCancel,
  paymentSuccess,
};
