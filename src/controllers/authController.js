const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const OrganizerModel = require("../models/OrganizerModel");
const NotificatioModel = require("../models/NotificationModel");
const {
  handleSendNotification,
  sendPushNotification,
} = require("../utils/notificationHandler");

require("dotenv").config();

const getJsonWebToken = async (email, id) => {
  const payload = {
    email,
    id,
  };
  const options = {
    expiresIn: "7d",
  };
  const token = jwt.sign(payload, process.env.SECRET_KEY, options);
  return token;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USERNAME_EMAIL,
    pass: process.env.PASSWORD_EMAIL,
  },
});

const verification = asyncHandle(async (req, res) => {
  const { email } = req.body;

  const verificationCode = Math.round(1000 + Math.random() * 9000);

  const mailOptions = {
    from: `"Support EventHub Appplication" <${process.env.USERNAME_EMAIL}>`, // Thay bằng email của bạn
    to: email,
    subject: "Xác minh tài khoản",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <h2 style="color: #333333;">Xác Minh Tài Khoản</h2>
               <p style="color: #666666;">Xin chào,</p>
               <p style="color: #666666;">Cảm ơn bạn đã đăng ký tài khoản với chúng tôi. Đây là mã xác minh của bạn:</p>
               <h3 style="color: #333333;">Mã Xác Minh: ${verificationCode}</h3>
               <p style="color: #666666;">Vui lòng sử dụng mã này để hoàn tất quy trình xác minh tài khoản của bạn.</p>
               <p style="color: #666666;">Xin cảm ơn.</p>
               <p style="color: #666666;">Trân trọng,</p>
               <p style="color: #333333;">Event Hub</p>
            </div>
         `,
  };

  try {
    // Gửi email
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: "Send verification email successfully",
      data: {
        verificationCode: verificationCode,
      },
    });
  } catch (error) {
    //  console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

const forgotPassword = asyncHandle(async (req, res) => {
  const { email, newPassword } = req.body;
  let existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    existingUser = await OrganizerModel.findOne({ email });
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (existingUser && !existingUser.password) {
    return res.status(404).json({ message: "Tài khoản đã liên kết" });
  }

  const verificationCode = Math.round(1000 + Math.random() * 9000);

  const mailOptions = {
    from: `"Support EventHub Appplication" <${process.env.USERNAME_EMAIL}>`, // Thay bằng email của bạn
    to: email,
    subject: "Khôi phục mật khẩu",
    html: `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2>Yêu cầu khôi phục mật khẩu</h2>
    
             <p>Chào bạn,</p>
             
             <p>Bạn đã yêu cầu khôi phục mật khẩu của mình. Đây là mã xác minh của bạn:</p>
             
             <p><strong>Verification Code: <span style="font-weight: bold; color: #ff0000;">${verificationCode}</span></strong></p>
             
             <p>Vui lòng nhập mã này vào ứng dụng của bạn để hoàn tất quá trình khôi phục mật khẩu. Xin lưu ý rằng mã xác minh sẽ hết hạn sau một thời gian ngắn.</p>
             
             <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
             
             <p>Trân trọng,<br> Event Hub Support</p>
             </div>
          `,
  };

  try {
    // Gửi email
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: "Send verification email successfully",
      data: {
        verificationCode: verificationCode,
      },
    });
  } catch (error) {
    //  console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }

  // if (newPassword) {
  //   const salt = await bcrypt.genSalt(10);
  //   const hashedPassword = await bcrypt.hash(newPassword, salt);

  //   await UserModel.findByIdAndUpdate(existingUser._id, {
  //     password: hashedPassword,
  //     isChangePassword: true,
  //   })
  //     .then(() => {
  //       console.log("Done");
  //     })
  //     .catch((error) => console.log(error));
  // }
});

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    let existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      existingUser = await OrganizerModel.findOne({ email });
    }

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    existingUser.password = hashedPassword;
    existingUser.updatedAt = Date.now();

    await existingUser.save();
    const newNoti = new NotificatioModel({
      userId: existingUser._id,
      body: "Bạn đã thay đổi mật khẩu mới",
      title: "Đổi mật khẩu",
      type: "account",
    });
    await newNoti.save();
    res.status(200).json({ message: "Thành công" });
  } catch (error) {
    res.status(400).json({ message: "Lỗi" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    console.log(req.body);
    let existingUser = await UserModel.findById(userId);

    if (!existingUser) {
      existingUser = await OrganizerModel.findById(userId);
    }

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const salt = await bcrypt.genSalt(10);
    const isMatchPassword = await bcrypt.compare(
      oldPassword,
      existingUser.password
    );

    if (!isMatchPassword) {
      return res.status(401).json({ message: "Mật khẩu cũ không đúng" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    existingUser.password = hashedPassword;
    existingUser.updatedAt = Date.now();

    await existingUser.save();
    const newNoti = new NotificatioModel({
      userId: existingUser._id,
      body: "Bạn đã thay đổi mật khẩu mới",
      title: "Đổi mật khẩu",
      type: "account",
    });
    await newNoti.save();
    res.status(200).json({ message: "Thành công" });
  } catch (error) {
    res.status(400).json({ message: "Lỗi" });
  }
};
const checkLinked = async (req, res) => {
  try {
    const { userId } = req.query;
    let existingUser = await UserModel.findById(userId);

    if (!existingUser) {
      existingUser = await OrganizerModel.findById(userId);
    }

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existingUser && existingUser.password) {
      return res.status(200).json({ message: "Không liên kết", data: false });
    } else {
      return res.status(200).json({ message: "Liên kết", data: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi" });
  }
};
const register = asyncHandle(async (req, res) => {
  const { email, name, password, fcmTokens } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    res.status(400);
    throw new Error("User has already exits !");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new UserModel({
    email,
    name: name ? name : "",
    photo: "https://th.bing.com/th/id/OIP.DxdqBFLVLPcWsjkds8636QHaHf?rs=1&pid=ImgDetMain",
    password: hashedPassword,
    fcmTokens: fcmTokens ?? [],
  });

  await newUser.save();
  sendPushNotification(
    newUser.fcmTokens,
    "Chúc mừng! Tài khoản của bạn đã được tạo thành công trên EventHub. Bắt đầu khám phá và tham gia vào các sự kiện độc đáo ngay bây giờ!",
    "Tạo Tài Khoản Thành Công"
  );
  const newNoti = new NotificatioModel({
    userId: newUser._id,
    body: `Chúc mừng! Tài khoản của bạn đã được tạo thành công trên EventHub. Bắt đầu khám phá và tham gia vào các sự kiện độc đáo ngay bây giờ!`,
    title: "Tạo Tài Khoản Thành Công",
    type: "account",
  });
  await newNoti.save();
  res.status(200).json({
    message: "Register new user successfully",
    data: {
      email: newUser.email,
      id: newUser._id,
      name: name ?? "",
      accessToken: await getJsonWebToken(email, newUser._id),
      fcmTokens: newUser.fcmTokens ?? [],
      favorites: newUser.favorites ?? [],
    },
  });
});

const registerOrganizer = asyncHandle(async (req, res) => {
  const { email, name, password, address, organization, fcmTokens } = req.body;

  const existingOrganizer = await OrganizerModel.findOne({ email });

  if (existingOrganizer) {
    res.status(400);
    throw new Error("Organizer has already exits !");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newOrganizer = new OrganizerModel({
    email,
    name: name ? name : "",
    photo: "https://th.bing.com/th/id/OIP.DxdqBFLVLPcWsjkds8636QHaHf?rs=1&pid=ImgDetMain",
    password: hashedPassword,
    fcmTokens: fcmTokens ?? [],
    organizationAddress: address,
    organizationName: organization,
  });

  await newOrganizer.save();
  sendPushNotification(
    newOrganizer.fcmTokens,
    "Chúc mừng! Tài khoản của bạn đã được tạo thành công trên EventHub. Bắt đầu khám phá và tham gia vào các sự kiện độc đáo ngay bây giờ!",
    "Tạo Tài Khoản Thành Công"
  );
  const newNoti = new NotificatioModel({
    userId: newOrganizer._id,
    body: `Chúc mừng! Tài khoản của bạn đã được tạo thành công trên EventHub. Bắt đầu khám phá và tham gia vào các sự kiện độc đáo ngay bây giờ!`,
    title: "Tạo Tài Khoản Thành Công",
    type: "account",
  });
  await newNoti.save();
  res.status(200).json({
    message: "Register new user successfully",
    data: {
      email: newOrganizer.email,
      id: newOrganizer._id,
      name: name ?? "",
      organization: newOrganizer.organizationName,
      accessToken: await getJsonWebToken(email, newOrganizer._id),
      fcmTokens: newOrganizer.fcmTokens ?? [],
      favorites: newOrganizer.favorites ?? [],
    },
  });
});
const login = asyncHandle(async (req, res) => {
  const { email, password, fcmToken } = req.body;
  let existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    existingUser = await OrganizerModel.findOne({ email });
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!existingUser.fcmTokens.includes(fcmToken)) {
    // Nếu chưa tồn tại, thêm userInfo.fcmToken vào mảng fcmTokens
    existingUser.fcmTokens.push(fcmToken);
  }
  await existingUser.save();
  const isMatchPassword = await bcrypt.compare(password, existingUser.password);

  if (!isMatchPassword) {
    res.status(401);
    throw new Error("Username or password are incorrect");
  }

  res.status(200).json({
    message: "Login successfully",
    data: {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.name ?? "",
      accessToken: await getJsonWebToken(email, existingUser.id),
      organization: existingUser.organizationName ?? "",
      fcmTokens: existingUser.fcmTokens ?? [],
      favorites: existingUser.favorites ?? [],
    },
  });
});

const checkUser = async (req, res) => {
  try {
    const { email } = req.query;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(403).json({ message: "User đã tồn tại !" });
    }
    const existingOrganizer = await OrganizerModel.findOne({ email });
    if (existingOrganizer) {
      return res.status(403).json({ message: "Organizer đã tồn tại !" });
    }
    res.status(200).json({ message: "Chưa có user hoặc organizer" });
  } catch (error) {
    return res.status(500).json({ message: "Lõi" });
  }
};
const loginSocial = asyncHandle(async (req, res) => {
  const userInfo = req.body;
  console.log(userInfo);
  const existingUser = await UserModel.findOne({ email: userInfo.email });
  let user;
  if (existingUser) {
    console.log(userInfo);
    if (!existingUser.fcmTokens.includes(userInfo.fcmTokens)) {
      // Nếu chưa tồn tại, thêm userInfo.fcmToken vào mảng fcmTokens
      existingUser.fcmTokens.push(userInfo.fcmTokens);
    }
    // Cập nhật updatedAt và lưu lại người dùng
    existingUser.updatedAt = Date.now();
    await existingUser.save();
    existingUser.save();
    user = existingUser;
    console.log("huu", user);
  } else {
    const newUser = new UserModel({
      email: userInfo.email,
      name: userInfo.name,
      ...userInfo,
    });
    await newUser.save();
    user = newUser;
    console.log("user", user._id);
  }
  user.accessToken = await getJsonWebToken(userInfo.email, user._id);

  res.status(200).json({
    message: "Login Social Successfully !",
    data: {
      accessToken: user.accessToken,
      id: user._id,
      email: user.email,
      fcmTokens: user.fcmTokens ?? [],
      photo: user.photo,
      name: user.name,
      favorites: user.favorites ?? [],
    },
  });
});

const deleteFcmToken = async (req, res) => {
  try {
    const { fcmToken, userId } = req.body;
    console.log(req.body);
    let user = await UserModel.findById(userId);

    if (!user) {
      // Nếu không tìm thấy, tìm trong collection người tổ chức sự kiện
      user = await OrganizerModel.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const index = user.fcmTokens.indexOf(fcmToken);

    if (index === -1) {
      return res.status(404).json({ message: "FcmToken not found" });
    }
    console.log(index);
    user.fcmTokens.splice(index, 1);
    await user.save();

    res.status(200).json({ message: "Thành công", data: user.fcmTokens });
  } catch (error) {
    res.status(500).json("Lỗi");
  }
};
module.exports = {
  register,
  login,
  verification,
  forgotPassword,
  loginSocial,
  checkUser,
  registerOrganizer,
  resetPassword,
  deleteFcmToken,
  changePassword,
  checkLinked
};
