const HttpError = require("../shared/HttpError");

function notFound(req, res) {
  res.status(404).send({ message: "The requested Zap Shift API route was not found." });
}

function errorHandler(error, req, res, next) {
  const status = error instanceof HttpError ? error.status : 500;
  const response = {
    message: status === 500 ? "Zap Shift could not complete the request. Please try again." : error.message,
  };

  if (status === 500) {
    console.error(error);
  } else if (error.details) {
    Object.assign(response, error.details);
  }

  res.status(status).send(response);
}

module.exports = { notFound, errorHandler };
