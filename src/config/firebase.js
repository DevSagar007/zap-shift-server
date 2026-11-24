const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { fbServiceKey } = require("./env");

function decodeServiceAccount() {
  try {
    return JSON.parse(Buffer.from(fbServiceKey, "base64").toString("utf8"));
  } catch {
    throw new Error(
      "FB_SERVICE_KEY must be a base64-encoded Firebase service account JSON",
    );
  }
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(decodeServiceAccount()) });
}

module.exports = { auth: getAuth() };
