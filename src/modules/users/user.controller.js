const {
  createUser,
  findUsers,
  findUserRole,
  updateUserRole,
} = require("./user.service");

async function create(req, res) {
  const result = await createUser(req.body);

  if (result.exists) {
    return res.send({ message: "user exists" });
  }

  res.send(result.result);
}

async function list(req, res) {
  res.send(await findUsers(req.query.searchTerm));
}

async function getRole(req, res) {
  res.send({ role: await findUserRole(req.params.email) });
}

async function updateRole(req, res) {
  res.send(await updateUserRole(req.params.id, req.body.role));
}

module.exports = { create, list, getRole, updateRole };
