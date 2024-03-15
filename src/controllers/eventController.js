// Import các mô hình và các module cần

const Event = require("../models/EventModel");

// Route POST để thêm mới sự kiện
const addEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime, organizer } =
      req.body;
    const newEvent = new Event({
      title,
      description,
      location,
      startTime,
      endTime,
      organizer,
    });
    await newEvent.save();
    res.status(200).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEventById = async (req, res) => {
  const { eventId } = req.body;
  try {
    const event = await Event.findById(eventId).populate(
      "organizer",
      "name email"
    );
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
    const eventList =await Event.find();
    res.status(200).json({data: eventList});
  } catch (error) {
    res.status(400).json( {message: error.message});
  }
};

module.exports = { addEvent, getEventById, getAllEvent };
