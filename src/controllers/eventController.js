// Import các mô hình và các module cần
const mongoose = require("mongoose");
const Event = require("../models/EventModel");
const UserModel = require("../models/UserModel");

// Route POST để thêm mới sự kiện
const addEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      organizer,
      photoUrl,
    } = req.body;
    const newEvent = new Event({
      title,
      description,
      location,
      startTime,
      endTime,
      organizer,
      photoUrl,
    });
    await newEvent.save({ session });

    const userId = organizer;
    const user = await UserModel.findById(userId).session(session);
    user.events.push(newEvent._id);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(newEvent);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
  }
};

const getEventById = async (req, res) => {
  const Id = req.params.eventId;
  try {
    const event = await Event.findById(Id)
      .populate("organizer", "name email")
      .populate("attendees", "name email");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại." });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllEvent = async (req, res) => {
  try {
    const eventList = await Event.find()
      .populate("organizer", "name email photo")
      .populate("attendees", "name email photo");
    res.status(200).json({ data: eventList });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { addEvent, getEventById, getAllEvent };
