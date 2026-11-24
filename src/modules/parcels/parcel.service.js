const { getCollection } = require("../../config/database");
const { COLLECTIONS, DELIVERY_STATUS, WORK_STATUS } = require("../../shared/constants");
const HttpError = require("../../shared/HttpError");
const { parseObjectId } = require("../../shared/objectId");
const { generateTrackingId } = require("../../shared/trackingId");
const { setRiderWorkStatus } = require("../riders/rider.service");
const { logTracking } = require("../trackings/tracking.service");

async function parcelsCollection() {
  return getCollection(COLLECTIONS.PARCELS);
}

async function listParcels({ email, deliveryStatus }) {
  const query = {};

  if (email) {
    query.$or = [{ senderEmail: email }, { receiverEmail: email }];
  }

  if (deliveryStatus) {
    query.deliveryStatus = deliveryStatus;
  }

  const parcels = await parcelsCollection();

  return parcels.find(query, { sort: { createdAt: -1 } }).toArray();
}

async function listRiderParcels({ riderEmail, deliveryStatus }) {
  const query = {};

  if (riderEmail) {
    query.riderEmail = riderEmail;
  }

  if (deliveryStatus !== DELIVERY_STATUS.DELIVERED) {
    query.deliveryStatus = { $nin: [DELIVERY_STATUS.DELIVERED] };
  } else {
    query.deliveryStatus = deliveryStatus;
  }

  const parcels = await parcelsCollection();
  return parcels.find(query).toArray();
}

async function findParcelById(id) {
  const objectId = parseObjectId(id, "parcel id");
  const parcels = await parcelsCollection();

  return parcels.findOne({ _id: objectId });
}

async function getDeliveryStatusStats() {
  const parcels = await parcelsCollection();
  const pipeline = [
    {
      $group: {
        _id: "$deliveryStatus",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        status: "$_id",
        count: 1,
      },
    },
  ];

  return parcels.aggregate(pipeline).toArray();
}

async function createParcel(parcel) {
  const trackingId = generateTrackingId();
  const newParcel = {
    ...parcel,
    createdAt: new Date(),
    trackingId,
  };
  const parcels = await parcelsCollection();
  const result = await parcels.insertOne(newParcel);

  await logTracking(trackingId, DELIVERY_STATUS.CREATED);

  return result;
}

async function deleteParcel(id) {
  const objectId = parseObjectId(id, "parcel id");
  const parcels = await parcelsCollection();

  return parcels.deleteOne({ _id: objectId });
}

async function assignRider(id, payload) {
  const {
    riderId,
    riderName,
    riderEmail,
    riderPhone,
    parcelId,
    trackingId,
  } = payload;

  if (!riderId) {
    throw new HttpError(400, "riderId is required");
  }

  const objectId = parseObjectId(id, "parcel id");
  const parcels = await parcelsCollection();
  const parcelResult = await parcels.updateOne(
    { _id: objectId },
    {
      $set: {
        deliveryStatus: DELIVERY_STATUS.DRIVER_ASSIGNED,
        riderId,
        parcelId,
        riderName,
        riderEmail,
        riderPhone,
      },
    },
  );

  const riderResult = await setRiderWorkStatus(
    riderId,
    WORK_STATUS.IN_DELIVERY,
  );

  await logTracking(trackingId, DELIVERY_STATUS.DRIVER_ASSIGNED);

  return { parcelResult, riderResult };
}

async function updateParcelStatus(id, payload) {
  const { deliveryStatus, riderId, trackingId } = payload;

  if (!deliveryStatus) {
    throw new HttpError(400, "deliveryStatus is required");
  }

  if (deliveryStatus === DELIVERY_STATUS.DELIVERED && !riderId) {
    throw new HttpError(400, "riderId is required");
  }

  const objectId = parseObjectId(id, "parcel id");
  const parcels = await parcelsCollection();
  const result = await parcels.updateOne(
    { _id: objectId },
    { $set: { deliveryStatus } },
  );

  if (deliveryStatus === DELIVERY_STATUS.DELIVERED) {
    await setRiderWorkStatus(riderId, WORK_STATUS.AVAILABLE);
  }

  await logTracking(trackingId, deliveryStatus);

  return result;
}

async function markParcelPaid(id) {
  const objectId = parseObjectId(id, "parcel id");
  const parcels = await parcelsCollection();

  return parcels.updateOne(
    { _id: objectId },
    {
      $set: {
        paymentStatus: "paid",
        deliveryStatus: DELIVERY_STATUS.PENDING_PICKUP,
      },
    },
  );
}

module.exports = {
  listParcels,
  listRiderParcels,
  findParcelById,
  getDeliveryStatusStats,
  createParcel,
  deleteParcel,
  assignRider,
  updateParcelStatus,
  markParcelPaid,
};
