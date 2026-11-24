if (require.main === module) {
  require("./src/server");
} else {
  module.exports = require("./src/app");
}
