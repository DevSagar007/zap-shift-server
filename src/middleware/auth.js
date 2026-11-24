const { auth } = require("../config/firebase");
const { findUserByEmail } = require("../modules/users/user.service");
const HttpError = require("../shared/HttpError");
const asyncHandler = require("../shared/asyncHandler");
const crypto = require("crypto");

const SESSION_COOKIE = "__session";
const CSRF_COOKIE = "zap_shift_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function verifyCsrf(req) {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.[SESSION_COOKIE]) {
    return;
  }

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    throw new HttpError(403, "The Zap Shift security token is missing.");
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    throw new HttpError(403, "The Zap Shift security token is invalid.");
  }
}

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const sessionCookie = req.cookies?.[SESSION_COOKIE];

  if (!authorization && !sessionCookie) {
    throw new HttpError(401, "Please sign in to access this Zap Shift resource.");
  }

  let decoded;
  try {
    decoded = authorization
      ? await auth.verifyIdToken(
          authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : authorization,
        )
      : await auth.verifySessionCookie(sessionCookie, true);

  } catch {
    throw new HttpError(401, "Your Zap Shift session is invalid or expired.");
  }

  verifyCsrf(req);
  req.decoded = decoded;
  req.decoded_email = decoded.email;

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
