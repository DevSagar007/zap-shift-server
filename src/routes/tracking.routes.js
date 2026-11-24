const { Router } = require("express");
const controller = require("../modules/trackings/tracking.controller");
const asyncHandler = require("../shared/asyncHandler");

const router = Router();

router.get("/trackings/:trackingId/logs", asyncHandler(controller.logs));

module.exports = router;
