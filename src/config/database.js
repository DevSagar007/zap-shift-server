const { MongoClient } = require("mongodb");
const { mongoUri } = require("./env");

let client = null;
let connectionPromise = null;

async function connect() {
  if (connectionPromise) {
    return connectionPromise;
  }

  client = new MongoClient(mongoUri);

  connectionPromise = client
    .connect()
    .then(async () => {
      await client.db("admin").command({ ping: 1 });
      return client;
    })
    .catch((error) => {
      connectionPromise = null;
      client = null;
      throw error;
    });

  return connectionPromise;
}

async function getDb() {
  const connectedClient = await connect();
  return connectedClient.db("zap_shift_db");
}

async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

async function close() {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  connectionPromise = null;
}

module.exports = { connect, getDb, getCollection, close };
