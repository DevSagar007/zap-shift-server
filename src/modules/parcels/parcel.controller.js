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

async function list(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listParcels(req.query, pagination);

  sendPaginated(res, result, pagination);
}

async function listRiders(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listRiderParcels(req.query, pagination);

  sendPaginated(res, result, pagination);
}

async function getById(req, res) {
  res.send(await findParcelById(req.params.id));
}

async function getStatusStats(req, res) {
  res.send(await getDeliveryStatusStats());
}

async function create(req, res) {
  res.send(await createParcel(req.body));
}

async function remove(req, res) {
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
