const { Router } = require("express");
const controller = require("./parcel.controller");
const asyncHandler = require("../../shared/asyncHandler");
const { authenticate, requireRole } = require("../../middleware/auth");
const { ROLES } = require("../../shared/constants");

const router = Router();

router.get("/parcels", authenticate, asyncHandler(controller.list));
router.get("/parcels/riders", authenticate, requireRole(ROLES.RIDER), asyncHandler(controller.listRiders));
router.get("/parcels/delivery-status/stats", authenticate, requireRole(ROLES.ADMIN), asyncHandler(controller.getStatusStats));
router.get("/parcels/:id", authenticate, asyncHandler(controller.getById));
router.post("/parcels", authenticate, asyncHandler(controller.create));
router.delete("/parcels/:id", authenticate, asyncHandler(controller.remove));
router.patch("/parcels/:id", authenticate, requireRole(ROLES.ADMIN), asyncHandler(controller.assign));
router.patch("/parcels/:id/status", authenticate, requireRole(ROLES.RIDER), asyncHandler(controller.updateStatus));

module.exports = router;
