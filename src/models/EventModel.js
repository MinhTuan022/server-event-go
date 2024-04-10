const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  full_address: { type: String, required: true },
  geometry: {
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
  ticketTypes: [
    {
      typeTicket: {type: String,},
      price: {type: Number},
      quantity: {type: Number}
    }
  ]
});

eventSchema.index({ position: "2dsphere" });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
