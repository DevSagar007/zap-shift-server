const {
  listParcels,
  listRiderParcels,
  findParcelById,
  getDeliveryStatusStats,
  createParcel,
  deleteParcel,
  assignRider,
  updateParcelStatus,
} = require("./parcel.service");
const { parsePagination, sendPaginated } = require("../../shared/pagination");
const { findUserRole } = require("../users/user.service");
const HttpError = require("../../shared/HttpError");

async function isAdmin(req) {
  return (await findUserRole(req.decoded_email)) === "admin";
}

async function getOwnedParcel(req) {
  const parcel = await findParcelById(req.params.id);
  const admin = await isAdmin(req);
  const ownsParcel = [parcel?.senderEmail, parcel?.receiverEmail, parcel?.riderEmail].includes(req.decoded_email);

  if (!parcel || (!admin && !ownsParcel)) {
    throw new HttpError(404, "Parcel not found or you do not have access to it.");
  }

  return parcel;
}

async function list(req, res) {
  const admin = await isAdmin(req);
  const query = admin ? req.query : { ...req.query, email: req.decoded_email };
  const pagination = parsePagination(req.query);
  const result = await listParcels(query, pagination);

  sendPaginated(res, result, pagination);
}

async function listRiders(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listRiderParcels(req.query, pagination);

  sendPaginated(res, result, pagination);
}

async function getById(req, res) {
  res.send(await getOwnedParcel(req));
}

async function getStatusStats(req, res) {
  res.send(await getDeliveryStatusStats());
}

async function create(req, res) {
  if (req.body?.senderEmail !== req.decoded_email) {
    throw new HttpError(403, "A parcel must be created from your authenticated Zap Shift account.");
  }
  res.send(await createParcel({ ...req.body, senderEmail: req.decoded_email }));
}

async function remove(req, res) {
  await getOwnedParcel(req);
  res.send(await deleteParcel(req.params.id));
}

async function assign(req, res) {
  const { riderResult } = await assignRider(req.params.id, req.body);
  res.send(riderResult);
}

async function updateStatus(req, res) {
  res.send(await updateParcelStatus(req.params.id, req.body));
}

module.exports = {
  list,
  listRiders,
  getById,
  getStatusStats,
  create,
  remove,
  assign,
  updateStatus,
};
