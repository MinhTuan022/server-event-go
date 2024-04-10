const mongoose = require("mongoose")
const OrderModel = require("../models/OrderModel")
const EventModel = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const TicketModel = require("../models/TicketModel");

const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    // console.log({ eventId, userId, quantity, totalPrice, status });
    let order; 
    const existingOrder = await OrderModel.findOne({
      eventId: orderData.eventId,
      userId: orderData.userId,
      ticketId: orderData.ticketId
    });
    // console.log(existingTicket)
    if (existingOrder) {
      existingOrder.quantity += orderData.quantity;
      existingOrder.totalPrice += orderData.totalPrice;
      await existingOrder.save();
      order = existingOrder
    } else {
      const newOrder = new OrderModel({
        // eventId,
        // userId,
        // quantity,
        // totalPrice,
        // status,
        ...orderData,
      });
      // console.log(ticket);
      const event = await EventModel.findById(orderData.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event không tồn tại" });
      }
      event.attendees.push(orderData.userId);
      await event.save();
      await newOrder.save();
      order = newOrder
    }
    const orderInfo = await OrderModel.findById(order._id).populate("eventId", "title address startTime endTime photoEvent");
    res.status(200).json({ message: "Success", data: orderInfo });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const getOrder = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const orderList = await OrderModel.find().populate(
      "eventId",
      "title location startTime endTime photoEvent"
    );

    if (userId && status && status === "Paid") {
      const orderPaid = await OrderModel.find({
        userId: userId,
        status: "Paid",
      }).populate("eventId", "title location startTime endTime photoEvent");

      res.status(200).json({ message: "Succesfully", data: orderPaid });
    } else if (userId && status && status === "Completed") {
      const orderCompleted = await OrderModel.find({
        userId: userId,
        status: "Completed",
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data: orderCompleted });
    } else if (userId && status && status === "Cancelled") {
      const orderCancelled = await OrderModel.find({
        userId: userId,
        status: "Cancelled",
      }).populate("eventId", "title location startTime endTime photoUrl");

      res.status(200).json({ message: "Succesfully", data:orderCancelled });
    }else {
      res.status(200).json({ message: "Get all Ticket", data: orderList });
    }
  } catch (error) {
    res.status(500).json({ message: "Fail" });
  }
};

// const getOrderByUser = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     const ticketList = await TicketModel.find({ userId: userId }).populate(
//       "eventId",
//       "title location startTime endTime photoUrl"
//     );

//     res.status(200).json({ message: "Succesfully", data: ticketList });
//   } catch (error) {
//     res.status(500).json({ message: "Fail" });
//   }
// };
module.exports = {
  createOrder,
  getOrder,
  // getTicketByUser,
};
