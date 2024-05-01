const NotificationModel = require("../models/NotificationModel");
const { JWT } = require("google-auth-library");
const getNotification = async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log(await getAccessToken())
    const notiList = await NotificationModel.find({ userId }).sort({createdAt: -1});
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
    const { id } = req.body;
    
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
const getAccessToken = () => {
  return new Promise(function (resolve, reject) {
    const key = require("../eventhub-firebase-mess.json");
    const jwtClient = new JWT(
      key.client_email,
      null,
      key.private_key,
      ["https://www.googleapis.com/auth/cloud-platform"],
      null
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
};
module.exports = {
  getNotification,
  updateIsRead,
  checkUnreadNotifications
};
