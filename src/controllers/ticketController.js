const mongoose = require("mongoose");
const EventModel = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const TicketModel = require("../models/TicketModel");

const createTicket = async (req, res) => {
  try {
    const ticketData = req.body;
    // console.log({ eventId, userId, quantity, totalPrice, status });
    // console.log(ticketData)
    const existingTicket = await TicketModel.findOne({
      eventId: ticketData.eventId,
    });
    // console.log(existingTicket)
    if (existingTicket) {
      existingTicket.quantity += ticketData.quantity;
      existingTicket.totalPrice += ticketData.totalPrice;
      await existingTicket.save();
    } else {
      const ticket = new TicketModel({
        // eventId,
        // userId,
        // quantity,
        // totalPrice,
        // status,
        ...ticketData,
      });
      console.log(ticket);
      const event = await EventModel.findById(ticketData.eventId);
      // const user = Us
      if (!event) {
        return res.status(404).json({ message: "Event không tồn tại" });
      }
      event.attendees.push(ticketData.userId);
      await event.save();
      await ticket.save();
    }

    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const getTicket = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const ticketList = await TicketModel.find().populate(
      "eventId",
      "title location startTime endTime photoUrl"
    );

    if (userId && status && status === "Paid") {
      const ticketsPaid = await TicketModel.find({
        userId: userId,
        status: "Paid",
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data: ticketsPaid });
    } else if (userId && status && status === "Completed") {
      const ticketsCompleted = await TicketModel.find({
        userId: userId,
        status: "Completed",
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data: ticketsCompleted });
    } else if (userId && status && status === "Cancelled") {
      const ticketsCancelled = await TicketModel.find({
        userId: userId,
        status: "Cancelled",
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data: ticketsCancelled });
    } else if (userId) {
      const tickets = await TicketModel.find({
        userId: userId,
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data: tickets });
    } else {
      res.status(200).json({ message: "Get all Ticket", data: ticketList });
    }
  } catch (error) {
    res.status(500).json({ message: "Fail" });
  }
};

const getTicketByUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const ticketList = await TicketModel.find({ userId: userId }).populate(
      "eventId",
      "title location startTime endTime photoUrl"
    );

    res.status(200).json({ message: "Succesfully", data: ticketList });
  } catch (error) {
    res.status(500).json({ message: "Fail" });
  }
};
module.exports = {
  createTicket,
  getTicket,
  getTicketByUser,
};
