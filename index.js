const express = require("express");
const cors = require("cors");
const authRouter = require("./src/routers/authRouter");
const userRouter = require("./src/routers/userRouter");
const eventRouter = require("./src/routers/eventRouter");
const categoryRouter = require("./src/routers/categoryRouter");
const connectDB = require("./src/configs/connectDb");
const errorMiddleHandle = require("./src/middlewares/errorMiddleware");
const paypal = require('paypal-rest-sdk');
const paymentRouter = require("./src/routers/paymentRouter");
const ticketRouter = require("./src/routers/ticketRoute");
const orderRouter = require("./src/routers/orderRouter");


const app = express();

paypal.configure({
  mode:'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET
})

app.use(cors());
app.use(express.json());
const PORT = 3001;

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/event", eventRouter);
app.use("/category", categoryRouter)
app.use("/paypal", paymentRouter)
app.use("/ticket", ticketRouter)
app.use("/order", orderRouter)


connectDB();

app.use(errorMiddleHandle);

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log(`Server starting at https://localhost:${PORT}`);
});
