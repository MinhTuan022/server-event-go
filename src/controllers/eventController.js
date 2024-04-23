// Import các mô hình và các module cần
const mongoose = require("mongoose");
const EventModel = require("../models/EventModel");
const TicketModel = require("../models/TicketModel");
const UserModel = require("../models/UserModel");
const CategoryModel = require("../models/CategoryModel");
const OrderModel = require("../models/OrderModel");
const NotificationModel = require("../models/NotificationModel");
const {
  handleSendNotification,
  sendPushNotification,
} = require("../utils/notificationHandler");
const { paymentRefund } = require("../utils/refundHandler");

// Route POST để thêm mới sự kiện
const addEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title,
      description,
      address,
      fullAddress,
      startTime,
      endTime,
      organizer,
      photoEvent,
      category,
      geometry,
      tickets,
    } = req.body;

    if (!tickets || !Array.isArray(tickets)) {
      throw new Error("Tickets must be provided as an array.");
    }
    const newEvent = new EventModel({
      title,
      description,
      address,
      fullAddress,
      startTime,
      endTime,
      organizer,
      photoEvent,
      category,
      geometry,
    });
    const event = await newEvent.save({ session });

    const ticketPromises = tickets.map(async (ticketInfo) => {
      const newTicket = new TicketModel({
        eventId: event._id,
        ticketType: ticketInfo.ticketType,
        price: ticketInfo.price,
        initialQuantity: ticketInfo.quantity,
        quantity: ticketInfo.quantity,
      });

      return await newTicket.save({ session });
    });

    const savedTickets = await Promise.all(ticketPromises);

    // Lưu trữ ObjectId của các loại vé vào sự kiện
    event.tickets = savedTickets.map((ticket) => ticket._id);

    // Lưu trữ sự kiện đã cập nhật vào cơ sở dữ liệu
    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Tạo mới thành công", data: newEvent._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
  }
};

const getEventById = async (req, res) => {
  const { id } = req.query;
  try {
    const event = await EventModel.findById(id);
    // .populate(
    //   "tickets",
    //   "ticketType price quantity"
    // );
    // .populate("organizer", "name email")
    // .populate("attendees", "name followers");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại." });
    }
    res.status(200).json({ message: "Success", data: event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getEventByOrganizer = async (req, res) => {
  const { id } = req.query;
  try {
    const event = await EventModel.find({ organizer: id }).populate(
      "tickets",
      "ticketType price quantity"
    );

    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại." });
    }
    res.status(200).json({ message: "Success", data: event });
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
      const categoryObj = await CategoryModel.findOne({
        categoryName: category,
      }); // Find category by name
      if (categoryObj) {
        query.category = categoryObj._id; // Filter by category ID
      } else {
        res.status(400).json({ message: "Category not found" });
        return;
      }
    }
    const eventList = await EventModel.find(query)
      .populate("tickets", "ticketType price quantity")
      .sort({ startTime: 1 })
      .limit(limit ?? 0);

    if (lat && long && distance) {
      const filteredEvents = eventList.filter((event) => {
        const eventDistance = calculateDistance(
          lat,
          long,
          event.geometry.coordinates[1],
          event.geometry.coordinates[0]
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
    // console.log(ids);
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

const getFavoriteOfUser = async (req, res) => {
  try {
    const { ids } = req.query;
    const eventIds = ids.split(",");

    const events = await EventModel.find({ _id: { $in: eventIds } }).populate(
      "tickets",
      "ticketType price quantity"
    );

    res.status(200).json({
      message: "Successfully",
      data: events,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchEvent = async (req, res) => {
  try {
    const { title } = req.query;
    const events = await EventModel.find({ $text: { $search: title } });

    res.status(200).json({ message: "Search", data: events });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await EventModel.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại." });
    }

    const orders = await OrderModel.find({ eventId: eventId });
    if (orders.length > 0) {
      for (const order of orders) {
        const user = await UserModel.findById(order.userId);
        if (user) {
          try {
            paymentRefund(order._id);

            sendPushNotification(
              user.fcmTokens,
              `Xin chào ${user.name}, Sự kiện "${event.title}" mà bạn đã mua vé đã bị hủy.`,
              "Hủy sự kiện"
            );
            const newNotification = new NotificationModel({
              userId: order.userId,
              body: `Xin chào ${user.name}, Sự kiện "${event.title}" mà bạn đã mua vé đã bị hủy. Số tiền mà bạn thanh toán sẽ được hoàn lại. Trân trọng, Đội ngũ tổ chức sự kiện.`,
              title: "Hủy sự kiện",
              type: "event",
            });
            await newNotification.save();
          } catch (notificationError) {
            console.error("Lỗi khi gửi thông báo:", notificationError);
          }
        }
      }

      const deletedOrders = await OrderModel.deleteMany({ eventId: eventId });
      const deletedTickets = await TicketModel.deleteMany({ eventId: eventId });
    }

    res.status(200).json({ message: "Xóa sự kiện thành công." });
  } catch (error) {
    console.error("Lỗi khi xóa sự kiện:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi xóa sự kiện." });
  }
};

module.exports = {
  addEvent,
  getEventById,
  getEvent,
  getGoing,
  getFavoriteOfUser,
  getEventByOrganizer,
  searchEvent,
  deleteEvent,
};
