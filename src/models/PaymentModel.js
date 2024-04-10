const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  paymentMethod: String,
  amount: Number,
  transactionId: String,
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
