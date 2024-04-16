const NotificatioModel = require("../models/NotificationModel");

const getNotification = async (req, res) => {
  try {
    const { userId } = req.query;
console.log(req.query)
    const notiList = await NotificatioModel.find({ userId });
    if (!notiList) {
      return res.status(400).json("Không có thông báo nào");
    }

    res.status(200).json({ message: "Thành công", data: notiList });
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};

module.exports = {
  getNotification,
};
