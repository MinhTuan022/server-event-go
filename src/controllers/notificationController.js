const NotificationModel = require("../models/NotificationModel");

const getNotification = async (req, res) => {
  try {
    const { userId } = req.query;
    const notiList = await NotificationModel.find({ userId });
    if (!notiList) {
      return res.status(400).json("Không có thông báo nào");
    }

    res.status(200).json({ message: "Thành công", data: notiList });
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};

const updateIsRead = async (req, res) => {
  try {
    const { id } = req.query;
    const notification = await NotificationModel.findById(id);
    if (!notification) {
      return res.status(400).json("Không có thông báo nào");
    }

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ message: "Thành công", data: notification });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

const checkUnreadNotifications = async (req, res) => {
  try {
    const {userId} = req.query
    const unreadNotifications = await NotificationModel.find({userId: userId, isRead: false });

    if (unreadNotifications.length > 0) {
      res.status(200).json({ message: "Có thông báo chưa đọc", data: true });
    } else {
      res.status(200).json({ message: "Không có thông báo chưa đọc.", data: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

module.exports = {
  getNotification,
  updateIsRead,
  checkUnreadNotifications
};
