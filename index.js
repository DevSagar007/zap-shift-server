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

const username = encodeURIComponent(process.env.DB_USER);
const password = encodeURIComponent(process.env.DB_PASS);

const uri = `mongodb+srv://${username}:${password}@cluster0.uhofepr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

async function startServer() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB connected successfully");

    const database = client.db(process.env.DB_NAME);
    const usersCollection = database.collection("users");

    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "API is running",
      });
    });

    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();

      res.status(200).json({
        success: true,
        data: users,
      });
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
