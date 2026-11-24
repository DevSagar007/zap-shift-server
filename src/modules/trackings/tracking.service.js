const { getCollection } = require("../../config/database");
const { COLLECTIONS } = require("../../shared/constants");

async function trackingsCollection() {
  return getCollection(COLLECTIONS.TRACKINGS);
}

async function logTracking(trackingId, status) {
  if (!trackingId || !status) {
    return null;
  }

  const trackings = await trackingsCollection();

  return trackings.insertOne({
    trackingId,
    status,
    details: String(status).split("_").join(" "),
    createdAt: new Date(),
  });
}

async function getTrackingLogs(trackingId) {
  const trackings = await trackingsCollection();

  return trackings
    .find({ trackingId })
    .sort({ createdAt: 1 })
    .toArray();
}

module.exports = { logTracking, getTrackingLogs };
