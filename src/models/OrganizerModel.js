const { default: mongoose } = require("mongoose");

const OrganizerSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  organizationName: {
    type: String,
  },
  organizationAddress: {
    type: String,
  },
  about: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  photo: {
    type: String,
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  fcmTokens: [{ type: String }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const OrganizerModel = mongoose.model("Organizer", OrganizerSchema);
module.exports = OrganizerModel;
