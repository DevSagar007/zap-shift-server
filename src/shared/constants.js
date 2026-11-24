const ROLES = {
  ADMIN: "admin",
  RIDER: "rider",
  USER: "user",
};

const DELIVERY_STATUS = {
  CREATED: "parcel_created",
  PAID: "parcel_paid",
  PENDING_PICKUP: "pending-pickup",
  DRIVER_ASSIGNED: "diver_assigned",
  DELIVERED: "parcel_delivered",
};

const RIDER_STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
};

const WORK_STATUS = {
  AVAILABLE: "available",
  IN_DELIVERY: "in_delivery",
};

const COLLECTIONS = {
  USERS: "users",
  PARCELS: "parcels",
  PAYMENTS: "payments",
  RIDERS: "rider",
  TRACKINGS: "trackings",
};

module.exports = {
  ROLES,
  DELIVERY_STATUS,
  RIDER_STATUS,
  WORK_STATUS,
  COLLECTIONS,
};
