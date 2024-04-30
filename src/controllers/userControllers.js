const UserModel = require("../models/UserModel");
const OrganizerModel = require("../models/OrganizerModel");
const NotificatioModel = require("../models/NotificationModel");


const { JWT } = require("google-auth-library");
const {
  handleSendNotification,
  sendPushNotification,
} = require("../utils/notificationHandler");

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
    existingUser.updatedAt = Date.now();

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
    const user = await UserModel.findById(userId);
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
    const targetUser = await OrganizerModel.findById(targetUserId);
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

      targetUser.followers.push(userId);

      sendPushNotification(
        targetUser.fcmTokens,
        "Bạn đã nhận được 1 lượt theo dõi từ người dùng",
        "Đã có người theo dõi bạn"

      );

      const newNoti = new NotificatioModel({
        userId: targetUserId,
        body: "Bạn đã nhận được 1 lượt theo dõi từ người dùng",
        title: "Đã có người theo dõi bạn",
        type: "follow",
      });

      await newNoti.save();
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
const checkFollower = async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;
    // console.log(userId, targetUserId)
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
    const isFollower = currentUser.followers.includes(targetUserId);
    // console.log(isFollowing)
    res.status(200).json({
      message: isFollower ? "Theo dõi lại" : "Chưa Theo dõi",
      data: isFollower,
    });
  } catch (error) {
    console.error("Lỗi khi theo dõi người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
const checkRelationship = async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;
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
    const isFollower = targetUser.following.includes(userId);

    res.status(200).json({
      message:
        isFollowing && isFollower
          ? "Bạn Bè"
          : isFollowing
          ? "Đang theo dõi"
          : isFollower
          ? "Theo dõi lại"
          : "Chưa Theo dõi",
      data:
        isFollowing && isFollower
          ? "friend"
          : isFollowing
          ? "following"
          : isFollower
          ? "follower"
          : "none",
    });
  } catch (error) {
    console.log(error);
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
    const userFavorites = await UserModel.findById(userId, "favorites");
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

const getFriend = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const userFollowing = user.following;

    const friends = await UserModel.find({
      _id: { $in: userFollowing },
      following: { $in: [userId] },
    });

    res.status(200).json({ massage: "Thành công", data: friends });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { uid, fcmTokens } = req.body;
    await UserModel.findByIdAndUpdate(uid, {
      fcmTokens,
    });
    res.status(200).json({ message: "hihi", data: [] });
  } catch (error) {}
};
// const getAccessToken = () => {
//   return new Promise(function (resolve, reject) {
//     const key = require("../eventhub-firebase-mess.json");
//     const jwtClient = new JWT(
//       key.client_email,
//       null,
//       key.private_key,
//       ["https://www.googleapis.com/auth/cloud-platform"],
//       null
//     );
//     jwtClient.authorize(function (err, tokens) {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(tokens.access_token);
//     });
//   });
// };
// const handleSendNotification = async (fcmToken, body, title, notiData) => {
//   const axios = require("axios");
//   let data = JSON.stringify({
//     message: {
//       token: fcmToken,
//       notification: {
//         body: body,
//         title: title,
//       },
//       data: notiData,
//     },
//   });

//   let config = {
//     method: "post",
//     maxBodyLength: Infinity,
//     url: "https://fcm.googleapis.com/v1/projects/eventhub-416509/messages:send",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${await getAccessToken()}`,
//     },
//     data: data,
//   };

//   axios
//     .request(config)
//     .then((response) => {
//       console.log(JSON.stringify(response.data));
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };


const sendNotification = async (req, res) => {
  try {
    const { userId, body, title, data } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(400).json("Không có user");
    }
    // const fcmTokens = ;
    sendPushNotification(user.fcmTokens, body, title, data);
    res.status(200).json("thành công");
  } catch (error) {
    console.log(error);
  }
};

const getFollowings = async (req, res) => {
  try {
    const { ids } = req.query;
    // console.log(ids);
    const userIds = ids.split(",");

    const users = await OrganizerModel.find(
      { _id: { $in: userIds } },
      // "name followers photo _id"
    );
console.log(users)
    res.status(200).json({
      message: "Successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  getAllUser,
  getUserById,
  handleFollow,
  checkFollowingStatus,
  getFollowers,
  getFavorites,
  handleFavorite,
  updateProfile,
  checkRelationship,
  getFriend,
  updateFcmToken,
  sendNotification,
  getFollowings
};
