const { getCollection } = require("../../config/database");
const { COLLECTIONS, ROLES } = require("../../shared/constants");
const { parseObjectId } = require("../../shared/objectId");
const { escapeRegExp } = require("../../shared/text");

async function usersCollection() {
  return getCollection(COLLECTIONS.USERS);
}

async function createUser(user) {
  const users = await usersCollection();
  const email = user.email;
  const existingUser = await users.findOne({ email });

  if (existingUser) {
    return { exists: true, result: null };
  }

  const newUser = {
    ...user,
    role: ROLES.USER,
    createdAt: new Date(),
  };

  return { exists: false, result: await users.insertOne(newUser) };
}

async function findUsers(searchTerm) {
  const query = {};

  if (searchTerm) {
    const pattern = escapeRegExp(searchTerm);
    const matcher = { $regex: pattern, $options: "i" };
    query.$or = [{ name: matcher }, { email: matcher }, { role: matcher }];
  }

  const users = await usersCollection();

  return users
    .find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
}

async function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const users = await usersCollection();
  return users.findOne({ email });
}

async function findUserRole(email) {
  const user = await findUserByEmail(email);
  return user?.role || ROLES.USER;
}

async function updateUserRole(id, role) {
  const objectId = parseObjectId(id, "user id");
  const users = await usersCollection();

  return users.updateOne({ _id: objectId }, { $set: { role } });
}

async function setUserRoleByEmail(email, role) {
  if (!email) {
    return null;
  }

  const users = await usersCollection();
  return users.updateOne({ email }, { $set: { role } });
}

module.exports = {
  createUser,
  findUsers,
  findUserByEmail,
  findUserRole,
  updateUserRole,
  setUserRoleByEmail,
};
