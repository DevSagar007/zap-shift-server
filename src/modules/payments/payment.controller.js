const {
  createCheckoutSession,
  confirmPayment,
  listPayments,
} = require("./payment.service");

async function createSession(req, res) {
  res.send(await createCheckoutSession(req.body));
}

async function paymentSuccess(req, res) {
  res.send(await confirmPayment(req.query.session_id));
}

async function list(req, res) {
  const email = req.query.email;

  if (!req.decoded_email || email !== req.decoded_email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  res.send(await listPayments(email));
}

module.exports = { createSession, paymentSuccess, list };
