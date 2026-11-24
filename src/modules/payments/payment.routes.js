const { Router } = require("express");
const controller = require("./payment.controller");
const { authenticate } = require("../../middleware/auth");
const asyncHandler = require("../../shared/asyncHandler");

const router = Router();

router.post("/create-checkout-session", asyncHandler(controller.createSession));
router.patch("/payment-success", asyncHandler(controller.paymentSuccess));
router.get("/payments", authenticate, asyncHandler(controller.list));

module.exports = router;
