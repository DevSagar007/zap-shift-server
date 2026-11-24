const Stripe = require("stripe");
const { stripeSecret } = require("./env");

module.exports = Stripe(stripeSecret);
