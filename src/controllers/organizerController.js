const UserModel = require("../models/UserModel");
const OrganizerModel = require("../models/OrganizerModel");

const getOrganizerById = async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await OrganizerModel.findById(userId);
    // .populate("following", "name email");
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get User" });
  }
};

const updateProfileOgz = async (req, res) => {
  try {
    const { userId, name, about, photo, organization, address } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "No data provided for update" });
    }
    // firstName, lastName, about
    const existingUser = await OrganizerModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    existingUser.name = name || existingUser.name;
    existingUser.about = about || existingUser.about;
    existingUser.photo = photo || existingUser.photo;
    existingUser.organizationName =
      organization || existingUser.organizationName;
    existingUser.organizationAddress =
      address || existingUser.organizationAddress;
    existingUser.updatedAt = Date.now();

    await existingUser.save();

    res.status(200).json({
      message: "Profile updated successfully",
      data: existingUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { getOrganizerById, updateProfileOgz };
