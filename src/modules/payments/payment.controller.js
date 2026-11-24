const {
  createCheckoutSession,
  confirmPayment,
  listPayments,
} = require("./payment.service");
const { parsePagination, sendPaginated } = require("../../shared/pagination");

async function createSession(req, res) {
  res.send(await createCheckoutSession(req.body));
}

async function paymentSuccess(req, res) {
  res.send(await confirmPayment(req.query.session_id));
}

async function list(req, res) {
  const email = req.query.email;

  if (!req.decoded_email || email !== req.decoded_email) {
    return res.status(403).send({ message: "You can only view your own Zap Shift payment history." });
  }

  const pagination = parsePagination(req.query);
  const result = await listPayments(email, pagination);

  sendPaginated(res, result, pagination);
}

module.exports = { createSession, paymentSuccess, list };
