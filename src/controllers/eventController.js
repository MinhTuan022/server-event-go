// Import các mô hình và các module cần
const mongoose = require("mongoose");
const Event = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const CategoryModel = require("../models/CategoryModel");


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
      category,
      position,
      ticketTypes,
      totalTickets
    } = req.body;
    const newEvent = new Event({
      title,
      description,
      location,
      startTime,
      endTime,
      organizer,
      photoUrl,
      category,
      position,
      ticketTypes,
      totalTickets
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
    const event = await Event.findById(Id);
    // .populate("organizer", "name email")
    // .populate("attendees", "name followers");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại." });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const getEvent = async (req, res) => {
  const { lat, long, distance, date, limit, category } = req.query;
  try {
    let query = {};
    if (date) {
      query.startTime = { $gte: new Date(date) };
    }
    if (category) {
      const categoryObj = await CategoryModel.findOne({ key: category }); // Find category by name
      if (categoryObj) {
        query.category = categoryObj._id; // Filter by category ID
      } else {
        res.status(400).json({ message: "Category not found" });
        return;
      }
    }
    const eventList = await Event.find(query)
      .sort({ startTime: 1 })
      .limit(limit ?? 0)

    if (lat && long && distance) {
      const filteredEvents = eventList.filter((event) => {
        const eventDistance = calculateDistance(
          lat,
          long,
          event.position.coordinates[1],
          event.position.coordinates[0]
        );
        return eventDistance <= distance; // Check if distance is less than or equal to 5km
      });

      res.status(200).json({ data: filteredEvents });
    } else {
      res.status(200).json({ data: eventList });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getGoing = async (req, res) => {
  try {
    const { ids } = req.query;
    const userIds = ids.split(",");

    const users = await UserModel.find(
      { _id: { $in: userIds } },
      "name followers photo"
    );

    res.status(200).json({
      message: "Successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addEvent, getEventById, getEvent, getGoing };
