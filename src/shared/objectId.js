const { ObjectId } = require("mongodb");
const HttpError = require("./HttpError");

function parseObjectId(value, label = "id") {
  if (!ObjectId.isValid(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }

  return new ObjectId(value);
}

function toObjectIdOrNull(value) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

module.exports = { parseObjectId, toObjectIdOrNull };
