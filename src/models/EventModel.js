const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  position: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  images: [{ type: String }],
  photoUrl: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // ticketPrice: {
  //   type: Number,
  //   required: true
  // },
  totalTickets: {
    type: Number,
    required: true
  },
  ticketTypes: [
    {
      typeTicket: {type: String, enum: ["Economy", "VIP"]},
      price: {type: Number}
    }
  ]
  // tickets: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Ticket",
  //   },
  // ],
});

eventSchema.index({ position: "2dsphere" });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
