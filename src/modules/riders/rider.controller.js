const {
  createRider,
  listRiders,
  approveRider,
  getDeliveriesPerDay,
} = require("./rider.service");

async function create(req, res) {
  res.send(await createRider(req.body));
}

async function list(req, res) {
  res.send(await listRiders(req.query));
}

async function approve(req, res) {
  res.send(await approveRider(req.params.id, req.body));
}

async function deliveriesPerDay(req, res) {
  res.send(await getDeliveriesPerDay(req.query.email));
}

module.exports = { create, list, approve, deliveriesPerDay };
