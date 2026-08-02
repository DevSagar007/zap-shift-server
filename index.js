const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// stripe payment
const stripe = require("stripe")(process.env.STRIPE_PAYMENT_SECRET);

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

    // get parcels
    app.get("/parcels", async (req, res) => {
      // query data
      const query = {};
      const { email } = req.query;
      if (email) {
        query.$or = [{ senderEmail: email }, { receiverEmail: email }];
      }
      // sort
      const options = { sort: { createdAt: -1 } };

      const cursor = parcelsCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single product
    app.get("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.findOne(query);
      res.send(result);
    });

    // post parcels
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;
      // parcel created time
      parcel.createdAt = new Date();

      const result = await parcelsCollection.insertOne(parcel);
      res.send(result);
    });

    // delete parcels
    app.delete("/parcels/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.deleteOne(query);

      res.send(result);
    });

    // payment related api
    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      const amount = Number(paymentInfo.cost) * 100;

      if (!Number.isFinite(amount)) {
        return res.status(400).json({
          message: "Invalid payment amount",
          paymentInfo,
        });
      }
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, price_1234) of the product you want to sell
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: paymentInfo.parcelName,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: paymentInfo.senderEmail,
        mode: "payment",
        metadata: {
          parcelId: paymentInfo.parcelId,
        },
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,

        // Provide a name (for example, hosted_web_0001) to label this Checkout integration and measure its conversion independently
        // integration_identifier: "{{INTEGRATION_ID}}",
      });

      console.log(session);
      res.send({ url: session.url });
    });

    // Payment status check
    app.patch("/payment-success", async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("session retrieve", session);
      if (session.payment_status === "paid") {
        const id = session.metadata.parcelId;
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: "paid",
          },
        };
        const result = await parcelsCollection.updateOne(query, update);
        res.send(result);
      }

      res.send({ success: false });
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
