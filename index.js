const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Middleware
app.use(cors());
app.use(express.json());

// Replace the placeholder with your Atlas connection string
const username = encodeURIComponent(process.env.DB_USER);
const password = encodeURIComponent(process.env.DB_PASS);

const uri = `mongodb+srv://${username}:${password}@cluster0.uhofepr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

async function startServer() {
  try {
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB connected successfully");

    const db = client.db("zap_shift_db");
    const parcelsCollection = db.collection("parcels");

    // get parcels list
    app.get("/parcels", async (req, res) => {
      // query data
      const query = {};
      const { email } = req.query;
      if (email) {
        query.receiverEmail = email;
      }

      const cursor = parcelsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // parcels post
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;
      const result = await parcelsCollection.insertOne(parcel);
      res.send(result);
    });

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("Closing MongoDB connection...");

  await client.close();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
