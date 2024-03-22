const UserModel = require("../models/UserModel");

const getAllUser = async (req, res) => {
  try {
    const userList = await UserModel.find();
    console.log(userList);
    res
      .status(200)
      .json({ message: "Get List User Successfully", data: userList });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get List User" });
  }
};

const getUserById = async (req, res) => {
  const {userId} = req.query;
  try {
    const user = await UserModel.findById(userId)
      .populate("events")
      .populate("following", "name email");
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get User" });
  }
};
module.exports = {
  getAllUser,
  getUserById,
};
