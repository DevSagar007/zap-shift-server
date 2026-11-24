const {
  createRider,
  listRiders,
  approveRider,
  getDeliveriesPerDay,
} = require("./rider.service");
const { parsePagination, sendPaginated } = require("../../shared/pagination");

async function create(req, res) {
  res.send(await createRider(req.body));
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  const result = await listRiders(req.query, pagination);

  sendPaginated(res, result, pagination);
}

async function approve(req, res) {
  res.send(await approveRider(req.params.id, req.body));
}

async function deliveriesPerDay(req, res) {
  res.send(await getDeliveriesPerDay(req.query.email));
}

module.exports = { create, list, approve, deliveriesPerDay };
