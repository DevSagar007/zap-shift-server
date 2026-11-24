const { Router } = require("express");
const controller = require("./payment.controller");
const asyncHandler = require("../../shared/asyncHandler");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.post("/create-checkout-session", authenticate, asyncHandler(controller.createSession));
router.patch("/payment-success", authenticate, asyncHandler(controller.paymentSuccess));
router.get("/payments", authenticate, asyncHandler(controller.list));

module.exports = router;
