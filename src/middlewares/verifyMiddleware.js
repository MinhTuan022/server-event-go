const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      } else {
        return res.status(403).json({ message: "Invalid token" });
      }
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;