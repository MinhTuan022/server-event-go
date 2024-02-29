const UserModel = require("../models/userModel");
const bcryp = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");

const register = asyncHandle(async (req, res) => {
  const { email, fullname, password } = req.body;
  const getJsonWebToken = async (email, id) => {
    const payload = {
      email,
      id,
    };
    const options = {
      expiresIn: "7d",
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY, options);
    console.log(token);
    return token;
  };

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    res.status(400);
    throw new Error(`USER HAS ALREADY EXIST !`);
  }

  const salt = await bcryp.genSalt(10);
  const hashedPassword = await bcryp.hash(password, salt);
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
  //   res.send("Succes");
});
module.exports = {
  register,
};
