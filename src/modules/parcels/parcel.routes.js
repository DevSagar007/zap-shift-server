const { Router } = require("express");
const controller = require("./parcel.controller");
const asyncHandler = require("../../shared/asyncHandler");

const router = Router();

router.get("/parcels", asyncHandler(controller.list));
router.get("/parcels/riders", asyncHandler(controller.listRiders));
router.get("/parcels/:id", asyncHandler(controller.getById));
router.get("/parcels/delivery-status/stats", asyncHandler(controller.getStatusStats));
router.post("/parcels", asyncHandler(controller.create));
router.delete("/parcels/:id", asyncHandler(controller.remove));
router.patch("/parcels/:id", asyncHandler(controller.assign));
router.patch("/parcels/:id/status", asyncHandler(controller.updateStatus));

module.exports = router;
