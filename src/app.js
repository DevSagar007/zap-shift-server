const express = require("express");
const cors = require("cors");
const userRoutes = require("./modules/users/user.routes");
const parcelRoutes = require("./modules/parcels/parcel.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const riderRoutes = require("./modules/riders/rider.routes");
const trackingRoutes = require("./modules/trackings/tracking.routes");
const authRoutes = require("./modules/auth/auth.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.SITE_DOMAIN,
        "http://localhost:5173",
        "http://localhost:4173",
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by Zap Shift CORS policy."));
    },
    credentials: true,
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Limit", "X-Total-Pages"],
  }),
);
app.use(express.json());
app.use((req, res, next) => {
  const rawCookie = req.headers.cookie || "";
  req.cookies = Object.fromEntries(
    rawCookie
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([name, value]) => name && value)
      .map(([name, ...value]) => [name, decodeURIComponent(value.join("="))]),
  );
  next();
});

app.use(authRoutes);
app.use(userRoutes);
app.use(parcelRoutes);
app.use(paymentRoutes);
app.use(riderRoutes);
app.use(trackingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
