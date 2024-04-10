const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  ticketType: String,
  price: Number,
  quantity: Number,
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
