const { getCollection } = require("../../config/database");
const {
  COLLECTIONS,
  DELIVERY_STATUS,
  RIDER_STATUS,
  ROLES,
  WORK_STATUS,
} = require("../../shared/constants");
const { parseObjectId } = require("../../shared/objectId");
const { setUserRoleByEmail } = require("../users/user.service");

async function ridersCollection() {
  return getCollection(COLLECTIONS.RIDERS);
}

async function createRider(rider) {
  const riders = await ridersCollection();
  const newRider = {
    ...rider,
    status: RIDER_STATUS.PENDING,
    createAt: new Date(),
  };

  return riders.insertOne(newRider);
}

async function listRiders({ status, district, workStatus }) {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (district) {
    query.district = district;
  }

  if (workStatus) {
    query.workStatus = workStatus;
  }

  const riders = await ridersCollection();
  return riders.find(query).toArray();
}

async function approveRider(id, { status, email }) {
  const objectId = parseObjectId(id, "rider id");
  const riders = await ridersCollection();
  const result = await riders.updateOne(
    { _id: objectId },
    { $set: { status, workStatus: WORK_STATUS.AVAILABLE } },
  );

  if (status === RIDER_STATUS.APPROVED && email) {
    await setUserRoleByEmail(email, ROLES.RIDER);
  }

  return result;
}

async function setRiderWorkStatus(riderId, workStatus) {
  const objectId = parseObjectId(riderId, "rider id");
  const riders = await ridersCollection();

  return riders.updateOne({ _id: objectId }, { $set: { workStatus } });
}

async function getDeliveriesPerDay(email) {
  const parcels = await getCollection(COLLECTIONS.PARCELS);
  const pipeline = [
    {
      $match: {
        riderEmail: email,
        deliveryStatus: DELIVERY_STATUS.DELIVERED,
      },
    },
    {
      $lookup: {
        from: COLLECTIONS.TRACKINGS,
        localField: "trackingId",
        foreignField: "trackingId",
        as: "parcel_trackings",
      },
    },
    {
      $unwind: "$parcel_trackings",
    },
    {
      $match: {
        "parcel_trackings.status": DELIVERY_STATUS.DELIVERED,
      },
    },
    {
      $addFields: {
        deliverDay: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$parcel_trackings.createdAt",
          },
        },
      },
    },
    {
      $group: {
        _id: "$deliverDay",
        deliveredCount: { $sum: 1 },
      },
    },
  ];

  return parcels.aggregate(pipeline).toArray();
}

module.exports = {
  createRider,
  listRiders,
  approveRider,
  setRiderWorkStatus,
  getDeliveriesPerDay,
};
