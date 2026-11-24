const HttpError = require("../shared/HttpError");

function notFound(req, res) {
  res.status(404).send({ message: "route not found" });
}

function errorHandler(error, req, res, next) {
  const status = error instanceof HttpError ? error.status : 500;
  const response = {
    message: status === 500 ? "internal server error" : error.message,
  };

  if (status === 500) {
    console.error(error);
  } else if (error.details) {
    Object.assign(response, error.details);
  }

  res.status(status).send(response);
}

module.exports = { notFound, errorHandler };
