const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Paid", "Completed", "Cancelled"],
    default: "PENDING",
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
