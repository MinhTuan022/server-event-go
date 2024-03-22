const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  images: [{ type: String }],
  photoUrl:{type : String},
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tickets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
  ],
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
