const { getCollection } = require("../../config/database");
const { siteDomain } = require("../../config/env");
const stripe = require("../../config/stripe");
const { COLLECTIONS, DELIVERY_STATUS } = require("../../shared/constants");
const HttpError = require("../../shared/HttpError");
const { toObjectIdOrNull } = require("../../shared/objectId");
const { markParcelPaid } = require("../parcels/parcel.service");
const { logTracking } = require("../trackings/tracking.service");
const { DEFAULT_LIMIT } = require("../../shared/pagination");

async function paymentsCollection() {
  return getCollection(COLLECTIONS.PAYMENTS);
}

async function parcelsCollection() {
  return getCollection(COLLECTIONS.PARCELS);
}

async function createCheckoutSession(paymentInfo) {
  const amount = Math.round(Number(paymentInfo?.cost) * 100);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Invalid payment amount", { paymentInfo });
  }

  if (
    !paymentInfo.parcelName ||
    !paymentInfo.senderEmail ||
    !paymentInfo.parcelId ||
    !paymentInfo.trackingId
  ) {
    throw new HttpError(400, "Missing required payment information");
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "bdt",
          unit_amount: amount,
          product_data: {
            name: paymentInfo.parcelName,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: paymentInfo.senderEmail,
    mode: "payment",
    metadata: {
      parcelId: paymentInfo.parcelId,
      parcelName: paymentInfo.parcelName,
      trackingId: paymentInfo.trackingId,
    },
    success_url: `${siteDomain}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteDomain}/dashboard/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,
  });

  return { url: session.url };
}

async function confirmPayment(sessionId) {
  if (!sessionId) {
    throw new HttpError(400, "session_id is required");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const transactionId = session.payment_intent;
  const payments = await paymentsCollection();
  const existingPayment = transactionId
    ? await payments.findOne({ transactionId })
    : null;

  if (existingPayment) {
    return {
      message: "already exist",
      transactionId,
      trackingId: existingPayment.trackingId,
    };
  }

  if (session.payment_status !== "paid") {
    return { success: false };
  }

  const parcelId = session.metadata?.parcelId;
  const trackingId = session.metadata?.trackingId;

  if (!parcelId || !trackingId) {
    throw new HttpError(400, "Checkout session metadata is incomplete");
  }

  const modifyParcel = await markParcelPaid(parcelId);
  const payment = {
    amount: session.amount_total / 100,
    currency: session.currency,
    customerEmail: session.customer_email,
    parcelId,
    parcelName: session.metadata.parcelName,
    transactionId,
    paymentStatus: session.payment_status,
    paidAt: new Date(),
    trackingId,
  };

  const paymentInfo = await payments.insertOne(payment);

  await logTracking(trackingId, DELIVERY_STATUS.PAID);

  return {
    success: true,
    modifyParcel,
    trackingId,
    transactionId: payment.transactionId,
    paymentInfo,
  };
}

async function listPayments(email, pagination = {}) {
  const { skip = 0, limit = DEFAULT_LIMIT } = pagination;
  const payments = await paymentsCollection();
  const parcels = await parcelsCollection();
  const query = { customerEmail: email };
  const [paymentDocs, total] = await Promise.all([
    payments
      .find(query)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    payments.countDocuments(query),
  ]);
  const items = await Promise.all(
    paymentDocs.map(async (payment) => {
      const parcelId = toObjectIdOrNull(payment.parcelId);
      const parcel = parcelId
        ? await parcels.findOne({ _id: parcelId })
        : null;

      return {
        ...payment,
        receiverName: parcel?.receiverName,
        receiverAddress: parcel?.receiverAddress,
        receiverDistrict: parcel?.receiverDistrict,
        receiverRegion: parcel?.receiverRegion,
        receiverContact: parcel?.receiverContact,
      };
    }),
  );

  return { items, total };
}

module.exports = { createCheckoutSession, confirmPayment, listPayments };
