const mongoose = require("mongoose");
const EventModel = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const TicketModel = require("../models/TicketModel");

const createTicket = async (req, res) => {
  try {
    const { eventId, userId, quantity, totalPrice, status } = req.body;
    // console.log({ eventId, userId, quantity, totalPrice, status });
    const ticket = new TicketModel({
      eventId,
      userId,
      quantity,
      totalPrice,
      status,
    });
    // console.log(ticket);
    const event = await EventModel.findById(eventId);
    // const user = Us
    if (!event) {
      return res.status(404).json({ message: "Event không tồn tại" });
    }
    event.attendees.push(userId);

    await ticket.save();
    await event.save();
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: "Fail" });
  }
};

const getAllTicket = async (req, res) => {
  try {
    const ticketList = await TicketModel.find();

    res.status(200).json({ message: "Get all Ticket", data: ticketList });
  } catch (error) {
    res.status(500).json({ message: "Fail" });

  }
};
module.exports = {
  createTicket,
  getAllTicket
};
