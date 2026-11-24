const { Router } = require("express");
const controller = require("./rider.controller");
const { authenticate, requireRole } = require("../../middleware/auth");
const asyncHandler = require("../../shared/asyncHandler");
const { ROLES } = require("../../shared/constants");

const router = Router();

router.patch(
  "/riders/:id",
  authenticate,
  requireRole(ROLES.ADMIN),
  asyncHandler(controller.approve),
);
router.get("/riders/delivery-per-day", authenticate, requireRole(ROLES.ADMIN), asyncHandler(controller.deliveriesPerDay));
router.post("/riders", authenticate, asyncHandler(controller.create));
router.get("/riders", authenticate, requireRole(ROLES.ADMIN), asyncHandler(controller.list));

module.exports = router;
