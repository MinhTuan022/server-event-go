const UserModel = require("../models/UserModel");

const getAllUser = async (req, res) => {
  try {
    const userList = await UserModel.find();
    // console.log(userList);
    res
      .status(200)
      .json({ message: "Get List User Successfully", data: userList });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get List User" });
  }
};
const updateProfile = async (req, res) => {
  try {
    const { userId, firstName, lastName, about, photo } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "No data provided for update" });
    }
    // firstName, lastName, about
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    existingUser.name =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName
        ? `${firstName} ${existingUser.lastname}`
        : lastName
        ? `${existingUser.firstname} ${lastName}`
        : existingUser.name;
    existingUser.firstname = firstName || existingUser.firstname;
    existingUser.lastname = lastName || existingUser.lastname;
    existingUser.about = about || existingUser.about;
    existingUser.photo = photo || existingUser.photo;
    existingUser.updateAt = Date.now()


    await existingUser.save();

    res.status(200).json({
      message: "Profile updated successfully",
      data: {
        name: existingUser.name,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        about: existingUser.about,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getUserById = async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await UserModel.findById(userId).populate("events");
    // .populate("following", "name email");
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: "Failed to Get User" });
  }
};

const handleFollow = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "Người dùng mục tiêu không tồn tại" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // currentUser.following = currentUser.following.filter(
      //   (id) => id !== targetUserId
      // );

      // targetUser.followers = targetUser.followers.filter((id) => id !== userId);
      const indexTarget = currentUser.following.indexOf(targetUserId);
      if (indexTarget !== -1) {
        currentUser.following.splice(indexTarget, 1);
      }

      const indexCurent = targetUser.followers.indexOf(userId);
      if (indexCurent !== -1) {
        targetUser.followers.splice(indexCurent, 1);
      }
    } else {
      currentUser.following.push(targetUserId);
      // Thêm userId vào danh sách followers của người dùng mục tiêu
      targetUser.followers.push(userId);
    }
    const followers = targetUser.followers.length;
    // console.log(followers)
    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing ? "Bỏ theo dõi thành công" : "Theo dõi thành công",
      data: { followers: followers, isFollowing: isFollowing },
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const checkFollowingStatus = async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;
    // console.log(userId, targetUserId)
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    // console.log(isFollowing)
    res.status(200).json({
      message: isFollowing ? "Đang theo dõi" : "Chưa Theo dõi",
      data: isFollowing,
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getFollowers = async (req, res) => {
  try {
    const { targetUserId } = req.query;
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "Người dùng mục tiêu không tồn tại" });
    }

    res.status(200).json({
      message: "Followers",
      data: targetUser.followers.length,
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getFavorites = async (req, res) => {
  const { userId } = req.query;
  try {
    const userFavorites = await UserModel.findById(
      userId,
      "favorites"
    ).populate("favorites");
    if (!userFavorites) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "Successfully", data: userFavorites.favorites });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const handleFavorite = async (req, res) => {
  const { eventId, userId } = req.body;
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json("User not found");
    }

    const isFavorite = user.favorites.includes(eventId);

    if (!isFavorite) {
      user.favorites.push(eventId);
    } else {
      const index = user.favorites.indexOf(eventId);
      if (index === -1) {
        return res
          .status(404)
          .json({ message: "Event not found in favorites" });
      }

      // Xóa sự kiện khỏi danh sách ưa thích của người dùng
      user.favorites.splice(index, 1);
    }
    await user.save();

    res.status(200).json({
      message: isFavorite
        ? "Event removed from favorites successfully"
        : "Event added to favorites successfully",
      data: user.favorites,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const addFavorite = async () => {};

const removeFavorite = async () => {};
module.exports = {
  getAllUser,
  getUserById,
  handleFollow,
  checkFollowingStatus,
  getFollowers,
  getFavorites,
  handleFavorite,
  updateProfile
};
