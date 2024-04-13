const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  ticketType: { type: String, required: true },
  price: { type: Number,  default:0},
  quantity: { type: Number, required: true },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
