const { getTrackingLogs } = require("./tracking.service");

async function logs(req, res) {
  res.send(await getTrackingLogs(req.params.trackingId));
}

module.exports = { logs };
