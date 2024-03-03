const UserModel = require("../models/userModel");
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

const register = asyncHandle(async (req, res) => {
  const { email, fullname, password } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: "User has already exits !" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new UserModel({
    email,
    fullname: fullname ?? "",
    password: hashedPassword,
  });

  await newUser.save();

  res.status(200).json({
    message: "Register new user successfully",
    data: {
      email: newUser.email,
      id: newUser.id,
      accessToken: await getJsonWebToken(email, newUser.id),
    },
  });
});

const login = asyncHandle(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    return res.status(403).json({ message: "User not found !" });
  }

  const isMatchPassword = await bcrypt.compare(password, existingUser.password);

  if (!isMatchPassword) {
    return res
      .status(401)
      .json({ message: "Username or password are incorrect" });
  }

  res.status(200).json({
    message: "Login successfully",
    data: {
      id: existingUser.id,
      email: existingUser.email,
      accessToken: await getJsonWebToken(email, existingUser.id),
    },
  });
});
module.exports = {
  register,
  login,
  verification,
};