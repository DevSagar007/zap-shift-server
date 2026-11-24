const app = require("./app");
const { port } = require("./config/env");
const { connect, close } = require("./config/database");

async function start() {
  await connect();

  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    server.close(async () => {
      try {
        await close();
      } finally {
        process.exit(0);
      }
    });
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
