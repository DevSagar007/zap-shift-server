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

async function list(req, res) {
  res.send(await listParcels(req.query));
}

async function listRiders(req, res) {
  res.send(await listRiderParcels(req.query));
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
