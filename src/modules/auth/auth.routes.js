const crypto = require("crypto");
const { Router } = require("express");
const { auth } = require("../../config/firebase");
const HttpError = require("../../shared/HttpError");

const router = Router();
const SESSION_COOKIE = "__session";
const CSRF_COOKIE = "zap_shift_csrf";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 5;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
  path: "/",
};

router.post("/auth/session", async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken || typeof idToken !== "string") {
    throw new HttpError(400, "A valid Firebase sign-in token is required.");
  }

  try {
    await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE,
    });
    const csrfToken = crypto.randomBytes(32).toString("hex");

    res.cookie(SESSION_COOKIE, sessionCookie, {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE,
    });
    res.cookie(CSRF_COOKIE, csrfToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: SESSION_MAX_AGE,
    });

    res.send({ success: true, csrfToken });
  } catch {
    throw new HttpError(401, "Unable to create a secure Zap Shift session.");
  }
});

router.delete("/auth/session", (req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.clearCookie(CSRF_COOKIE, { ...cookieOptions, httpOnly: false });
  res.send({ success: true });
});

module.exports = router;
