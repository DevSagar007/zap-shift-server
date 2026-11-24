const { Router } = require("express");
const userRoutes = require("./user.routes");
const parcelRoutes = require("./parcel.routes");
const paymentRoutes = require("./payment.routes");
const riderRoutes = require("./rider.routes");
const trackingRoutes = require("./tracking.routes");

const router = Router();

router.use(userRoutes);
router.use(parcelRoutes);
router.use(paymentRoutes);
router.use(riderRoutes);
router.use(trackingRoutes);

module.exports = router;
