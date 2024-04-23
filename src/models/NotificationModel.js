const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: String,
  title: String,
  body: String,
  isRead: { type: Boolean, default: false },
  type: String,
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
