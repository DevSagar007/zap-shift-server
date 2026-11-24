const {
  createUser,
  findUsers,
  findUserRole,
  updateUserRole,
} = require("./user.service");
const { parsePagination, sendPaginated } = require("../../shared/pagination");

async function create(req, res) {
  const result = await createUser(req.body);

  if (result.exists) {
    return res.send({ message: "A Zap Shift account already exists for this email." });
  }

  res.send(result.result);
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  const result = await findUsers(req.query.searchTerm, pagination);

  sendPaginated(res, result, pagination);
}

async function getRole(req, res) {
  res.send({ role: await findUserRole(req.params.email) });
}

async function updateRole(req, res) {
  res.send(await updateUserRole(req.params.id, req.body.role));
}

module.exports = { create, list, getRole, updateRole };
