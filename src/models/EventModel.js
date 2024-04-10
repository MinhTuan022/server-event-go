const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  fullAddress: { type: String, required: true },
  geometry: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  images: [{ type: String }],
  photoEvent: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
});

eventSchema.index({ position: "2dsphere" });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
