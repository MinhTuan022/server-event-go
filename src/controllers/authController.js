const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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
  const existingUser = await UserModel.findOne({ email });

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

  if (!existingUser) {
    return res
      .status(400)
      .json({ message: `Không tìm thấy tài khoản với email ${email}` });
  } else {
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
  }

  if (newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.findByIdAndUpdate(existingUser._id, {
      password: hashedPassword,
      isChangePassword: true,
    })
      .then(() => {
        console.log("Done");
      })
      .catch((error) => console.log(error));
  }
});

const register = asyncHandle(async (req, res) => {
  const { email, name, password } = req.body;

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
    password: hashedPassword,
  });

  await newUser.save();

  res.status(200).json({
    message: "Register new user successfully",
    data: {
      email: newUser.email,
      id: newUser._id,
      name: name ?? "",
      accessToken: await getJsonWebToken(email, newUser._id),
    },
  });
});

const login = asyncHandle(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    res.status(403);
    // .json({ message: "User not found !" });

    throw new Error("User not found !");
  }

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
      fcmTokens: existingUser.fcmTokens ?? []
    },
  });
});
const loginSocial = asyncHandle(async (req, res) => {
  const userInfo = req.body;
  console.log(userInfo);
  const existingUser = await UserModel.findOne({ email: userInfo.email });
  let user;
  if (existingUser) {
    console.log(userInfo)
    if (!existingUser.fcmTokens.includes(userInfo.fcmTokens)) {
      // Nếu chưa tồn tại, thêm userInfo.fcmToken vào mảng fcmTokens
      existingUser.fcmTokens.push(userInfo.fcmTokens);
    }
    // Cập nhật updatedAt và lưu lại người dùng
    existingUser.updateAt = Date.now();
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
    user = newUser ;
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
      favorites: user.favorites ?? []
    },
  });
});
module.exports = {
  register,
  login,
  verification,
  forgotPassword,
  loginSocial,
};
