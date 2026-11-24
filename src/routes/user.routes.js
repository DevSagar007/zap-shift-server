const { Router } = require("express");
const controller = require("../modules/users/user.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const asyncHandler = require("../shared/asyncHandler");
const { ROLES } = require("../shared/constants");

const router = Router();

router.post("/users", asyncHandler(controller.create));
router.get("/users", authenticate, asyncHandler(controller.list));
router.get("/users/:email/role", asyncHandler(controller.getRole));
router.patch(
  "/users/:id/role",
  authenticate,
  requireRole(ROLES.ADMIN),
  asyncHandler(controller.updateRole),
);

module.exports = router;
