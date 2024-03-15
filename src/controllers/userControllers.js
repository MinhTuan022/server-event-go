const UserModel = require("../models/UserModel")

const getAllUser = async (req, res) => {
  try {
    const userList = await UserModel.find();
    console.log(userList)
    res.status(200).json({message: "Get List User Successfully", data: userList})
  } catch (error) {
    res.status(500).json({ message: "Failed to Get List User" });
  }

}

module.exports = {
  getAllUser
}