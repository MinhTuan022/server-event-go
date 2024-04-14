const mongoose = require("mongoose");
const EventModel = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const TicketModel = require("../models/TicketModel");

const getTicket = async (req, res) => {
  try {
    const { ids } = req.query;
    const tiketIds = ids.split(",");

    const tickets = await TicketModel.find(
      { _id: { $in: tiketIds } },
      "quantity price ticketType"
    );

    res.status(200).json({
      message: "Successfully",
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
getTicket
};
