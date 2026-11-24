const express = require("express");
const cors = require("cors");
const userRoutes = require("./modules/users/user.routes");
const parcelRoutes = require("./modules/parcels/parcel.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const riderRoutes = require("./modules/riders/rider.routes");
const trackingRoutes = require("./modules/trackings/tracking.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use(userRoutes);
app.use(parcelRoutes);
app.use(paymentRoutes);
app.use(riderRoutes);
app.use(trackingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
