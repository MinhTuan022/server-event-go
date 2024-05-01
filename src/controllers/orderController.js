const mongoose = require("mongoose");
const OrderModel = require("../models/OrderModel");
const EventModel = require("../models/EventModel");
const UserModel = require("../models/UserModel");
const TicketModel = require("../models/TicketModel");
const { ObjectId } = require("mongoose").Types;
const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    // console.log({ eventId, userId, quantity, totalPrice, status });
    let order;
    // const existingOrder = await OrderModel.findOne({
    //   eventId: orderData.eventId,
    //   userId: orderData.userId,
    //   ticketId: orderData.ticketId,
    // });
    // // console.log(existingTicket)
    // if (existingOrder) {
    //   existingOrder.quantity += orderData.quantity;
    //   existingOrder.totalPrice += orderData.totalPrice;
    //   await existingOrder.save();
    //   order = existingOrder;
    // } else {
    const newOrder = new OrderModel(orderData);
    // console.log(ticket);

    const event = await EventModel.findById(orderData.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event không tồn tại" });
    }
    event.attendees.push(orderData.userId);
    await event.save();
    await newOrder.save();
    order = newOrder;

    if (orderData.totalPrice === 0) {
      const ticket = await TicketModel.findById(order.ticketId);

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found." });
      }
      if (ticket.quantity < orderData.quantity) {
        return res
          .status(400)
          .json({ message: "Not enough tickets available." });
      }

      const updatedTicket = await TicketModel.findByIdAndUpdate(
        order.ticketId,
        { $inc: { quantity: -orderData.quantity } },
        { new: true }
      );
    }

    const orderInfo = await OrderModel.findById(order._id)
      .populate("eventId", "title address startTime endTime photoEvent")
      .populate("ticketId", "price");
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
      "title address startTime endTime photoEvent organizer"
    );

    if (userId && status && status === "Paid") {
      const orderPaid = await OrderModel.find({
        userId: userId,
        status: { $in: ["Paid", "Pending"] },
      })
        .populate(
          "eventId",
          "title address startTime endTime photoEvent organizer"
        )
        .populate("ticketId", "price ticketType");
      res.status(200).json({ message: "Succesfully", data: orderPaid });
    } else if (userId && status && status === "Completed") {
      const orderCompleted = await OrderModel.find({
        userId: userId,
        status: "Completed",
      }).populate(
        "eventId",
        "title address startTime endTime photoEvent organizer"
      );

      res.status(200).json({ message: "Succesfully", data: orderCompleted });
    } else if (userId && status && status === "Cancelled") {
      const orderCancelled = await OrderModel.find({
        userId: userId,
        status: "Cancelled",
      }).populate(
        "eventId",
        "title address startTime endTime photoEvent organizer"
      );

      res.status(200).json({ message: "Succesfully", data: orderCancelled });
    } else {
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
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log(orderId);

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Đơn đặt hàng không tồn tại" });
    }

    const event = await EventModel.findById(order.eventId);
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    const userIdIndex = event.attendees.indexOf(order.userId);
    if (userIdIndex !== -1) {
      event.attendees.splice(userIdIndex, 1);
      await event.save();
    }
    if (order.status === "Pending") {
      await OrderModel.findByIdAndDelete(orderId);
    } else if (order.status === "Paid") {
      const ticket = await TicketModel.findById(order.ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Đơn đặt hàng không tồn tại" });
      }
      ticket.quantity += order.quantity;
      await ticket.save();
      order.status = "Cancelled";
      await order.save();
    }

    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa đơn đặt hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateStatusCompleted = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await OrderModel.findById(orderId);

    const event = await EventModel.findById(order.eventId);

    const eventStartTime = new Date(event.startTime).getTime();

    const currentTime = new Date().getTime();

    const oneDay = 24 * 60 * 60 * 1000;
    if (currentTime + oneDay >= eventStartTime && order.status === "Paid") {
      order.status = "Completed";
      await order.save();
    }

    res.status(200).json({ message: "update thành công", data: order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const countOrdersPerHour = async (req, res) => {
  try {
    const { eventId } = req.query;
    const ordersPerHour = await OrderModel.aggregate([
      {
        $match: {
          status: { $in: ["Paid", "Completed"] },
          eventId: new ObjectId(`${eventId}`),
          createdAt: { $gte: new Date(new Date() - 2 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            month: { $month: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            day: { $dayOfMonth: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            hour: { $hour: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
          },
          count: { $sum: 1 },
        },
      },
      {
        $limit: 7,
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.hour": 1,
        },
      },
    ]);
    const hours = ordersPerHour.map((item) => `${item._id.hour} giờ`);

    const counts = ordersPerHour.map((item) => item.count);

    console.log("first", ordersPerHour);
    console.log("first2", hours);
    res.status(200).json({ message: "Ok", data: { hours, counts } });
  } catch (error) {
    console.error("Error counting orders per hour:", error);
    throw error;
  }
};

const countCancelledPerHour = async (req, res) => {
  try {
    const { eventId } = req.query;
    const cancelledPerHour = await OrderModel.aggregate([
      {
        $match: {
          status: "Cancelled",
          eventId: new ObjectId(`${eventId}`),
          createdAt: { $gte: new Date(new Date() - 2 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            month: { $month: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            day: { $dayOfMonth: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
            hour: { $hour: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } },
          },
          count: { $sum: 1 },
        },
      },
      {
        $limit: 7,
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.hour": 1,
        },
      },
    ]);
    const hours = cancelledPerHour.map((item) => `${item._id.hour} giờ`);

    const counts = cancelledPerHour.map((item) => item.count);

    // console.log("first", ordersPerHour);
    // console.log("first2", hours);
    res.status(200).json({ message: "Ok", data: { hours, counts } });
  } catch (error) {
    console.error("Error counting orders per hour:", error);
    throw error;
  }
};

//   try {
//     const { eventId } = req.query;
//     const ordersPerHour = await OrderModel.aggregate([
//       {
//         $match: {
//           status: { $in: ["Paid", "Completed"] },
//           eventId: new ObjectId(`${eventId}`),
//           createdAt: { $gte: new Date(new Date() - 2 * 24 * 60 * 60 * 1000) },
//         },
//       },

//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//             day: { $dayOfMonth: "$createdAt" },
//             hour: { $hour: "$createdAt" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $limit: 7,
//       },
//       {
//         $sort: {
//           "_id.year": 1,
//           "_id.month": 1,
//           "_id.day": 1,
//           "_id.hour": 1,
//         },
//       },
//     ]);

//     const hours = ordersPerHour.map((item) => `${item._id.hour} giờ`);
//     const counts = ordersPerHour.map((item) => item.count);

//     console.log("first", ordersPerHour);
//     console.log("first2", hours);
//     res.status(200).json({ message: "Ok", data: { hours, counts } });
//   } catch (error) {
//     console.error("Error counting orders per hour:", error);
//     throw error;
//   }
// };

const countSoldTicket = async (req, res) => {
  try {
    const { eventId } = req.query;
    const soldTicketsByEventAndType = await OrderModel.aggregate([
      {
        $match: {
          status: { $in: ["Paid", "Completed"] },
          eventId: new ObjectId(`${eventId}`),
        },
      },
      {
        $group: {
          _id: { ticketId: "$ticketId" },
          totalSold: { $sum: "$quantity" },
        },
      },
      {
        $lookup: {
          from: "tickets", // Tên của bộ sưu tập Ticket
          localField: "_id.ticketId",
          foreignField: "_id",
          as: "ticketData",
        },
      },
    ]);
    const ticketInfoArray = [];

    soldTicketsByEventAndType.forEach((ticketSold) => {
      const ticketId = ticketSold._id.ticketId;
      const totalSold = ticketSold.totalSold;

      ticketSold.ticketData.forEach((ticket) => {
        const ticketType = ticket.ticketType;
        const ticketQuantity = ticket.initialQuantity;

        const percentageSold = totalSold / ticketQuantity;
        const ticketInfo = {
          totalSold: totalSold,
          ticketType: ticketType,
          ticketQuantity: ticketQuantity,
          percentageSold: percentageSold,
        };

        ticketInfoArray.push(ticketInfo);
      });
    });

    res.status(200).json({ message: "OK", data: ticketInfoArray });
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};

const getRevenue = async (req, res) => {
  try {
    const { eventId } = req.query;
    const orders = await OrderModel.find({
      status: { $in: ["Paid", "Completed"] },
      eventId: `${eventId}`,
    });
    if (!orders) {
      return res.status(400).json("Not Found");
    }
    const totalRevenue = orders.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );
    // console.log(totalRevenue);
    res.status(200).json({ message: "OK", data: totalRevenue });
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};
// getRevenue();
// test();
module.exports = {
  createOrder,
  getOrder,
  countCancelledPerHour,
  deleteOrder,
  updateStatusCompleted,
  countOrdersPerHour,
  countSoldTicket,
  getRevenue,
};
