const { auth } = require("../config/firebase");
const { findUserByEmail } = require("../modules/users/user.service");
const HttpError = require("../shared/HttpError");
const asyncHandler = require("../shared/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new HttpError(401, "unauthorized access");
  }

  const idToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : authorization;

  if (!idToken) {
    throw new HttpError(401, "unauthorized access");
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.decoded = decoded;
    req.decoded_email = decoded.email;
  } catch {
    throw new HttpError(401, "unauthorized access");
  }

  next();
});

function requireRole(role) {
  return asyncHandler(async (req, res, next) => {
    const user = await findUserByEmail(req.decoded_email);

    if (!user || user.role !== role) {
      throw new HttpError(403, "You do not have permission to perform this Zap Shift action.");
    }

    next();
  });
}

module.exports = { authenticate, requireRole };
