require("dotenv").config();

const requiredKeys = [
  "DB_USER",
  "DB_PASS",
  "FB_SERVICE_KEY",
  "STRIPE_PAYMENT_SECRET",
  "SITE_DOMAIN",
];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingKeys.join(", ")}`,
  );
}

const configuredPort = Number(process.env.PORT);
const port =
  Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 500;

const username = encodeURIComponent(process.env.DB_USER);
const password = encodeURIComponent(process.env.DB_PASS);

const mongoUri = `mongodb+srv://${username}:${password}@cluster0.uhofepr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

module.exports = {
  port,
  mongoUri,
  fbServiceKey: process.env.FB_SERVICE_KEY,
  stripeSecret: process.env.STRIPE_PAYMENT_SECRET,
  siteDomain: (process.env.SITE_DOMAIN || "").replace(/\/+$/, ""),
};
