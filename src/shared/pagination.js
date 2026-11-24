const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePagination(query = {}) {
  const page = toPositiveInteger(query.page, 1);
  const limit = Math.min(toPositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(total, pagination) {
  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
}

function setPaginationHeaders(res, meta) {
  res.set({
    "X-Total-Count": String(meta.total),
    "X-Page": String(meta.page),
    "X-Limit": String(meta.limit),
    "X-Total-Pages": String(meta.totalPages),
  });
}

function sendPaginated(res, result, pagination) {
  setPaginationHeaders(res, paginationMeta(result.total, pagination));
  res.send(result.items);
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePagination,
  paginationMeta,
  setPaginationHeaders,
  sendPaginated,
};
