const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const app = express();
const port = process.env.PORT || 3000;

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const serviceAccount = require("./zap-shift-firebase-adminsdk.json");

initializeApp({
  credential: cert(serviceAccount),
});

// verify firebase token
const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  try {
    const idToken = authorization.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : authorization;
    const decoded = await getAuth().verifyIdToken(idToken);
    req.decoded = decoded;
    req.decoded_email = decoded.email;
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  next();
};

// stripe payment
const stripe = require("stripe")(process.env.STRIPE_PAYMENT_SECRET);

// tracking id
const crypto = require("crypto");
const { create } = require("domain");

function generateTrackingId() {
  const prefix = "PRCL"; // Your brand prefix

  // Format: YYYYMMDD
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // 6-character random string
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${date}-${random}`;
}

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
    const userCollection = db.collection("users");
    const parcelsCollection = db.collection("parcels");
    const paymentCollection = db.collection("payments");
    const ridersCollection = db.collection("rider");
    const trackingCollection = db.collection("trackings");

    // middleware more with database access
    // must be use after verifyFBToken middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded_email;
      const query = { email };
      const user = await userCollection.findOne(query);

      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "forbidden access hh" });
      }

      next();
    };

    // verify Rider
    const verifyRider = async (req, res, next) => {
      const email = req.decoded_email;
      const query = { email };
      const user = await userCollection.findOne(query);

      if (!user || user.role !== "rider") {
        return res.status(403).send({ message: "forbidden access hh" });
      }

      next();
    };

    const logTracking = async (trackingId, status) => {
      const log = {
        trackingId,
        status,
        details: status.split("_").join(" "),
        createdAt: new Date(),
      };

      const result = await trackingCollection.insertOne(log);

      return result;
    };

    // user create apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createdAt = new Date();

      const email = user.email;
      const userExists = await userCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // user related api
    app.get("/users", verifyFireBaseToken, async (req, res) => {
      const searchTerm = req.query.searchTerm;
      const query = {};
      if (searchTerm) {
        // query.name = { $regex: searchTerm, $options: "i" };
        query.$or = [
          {
            name: {
              $regex: searchTerm,
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchTerm,
              $options: "i",
            },
          },
          {
            role: {
              $regex: searchTerm,
              $options: "i",
            },
          },
        ];
      }

      const cursor = userCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ role: user?.role || "user" });
    });

    app.patch(
      "/users/:id/role",
      verifyFireBaseToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const roleInfo = req.body;
        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: roleInfo.role,
          },
        };
        const result = await userCollection.updateOne(query, updatedDoc);
        res.send(result);
      },
    );

    // get parcels
    app.get("/parcels", async (req, res) => {
      // query data
      const query = {};
      const { email, deliveryStatus } = req.query;

      if (email) {
        query.$or = [{ senderEmail: email }, { receiverEmail: email }];
      }
      if (deliveryStatus) {
        query.deliveryStatus = deliveryStatus;
      }

      // sort
      const options = { sort: { createdAt: -1 } };

      const cursor = parcelsCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    // rider assign
    app.get("/parcels/riders", async (req, res) => {
      const { riderEmail, deliveryStatus } = req.query;
      const query = {};

      if (riderEmail) {
        query.riderEmail = riderEmail;
      }

      if (deliveryStatus !== "parcel_delivered") {
        // query.deliveryStatus = {$in: ['driver_assigned', 'rider_arriving']};
        query.deliveryStatus = { $nin: ["parcel_delivered"] };
      } else {
        query.deliveryStatus = deliveryStatus;
      }

      const cursor = parcelsCollection.find(query);
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

    app.get("/parcels/delivery-status/stats", async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: "$deliveryStatus",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            // _id: 0,
          },
        },
      ];
      const result = await parcelsCollection.aggregate(pipeline).toArray();
      res.send(result);
    });

    // post parcels
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;
      const trackingId = generateTrackingId();

      // parcel created time
      parcel.createdAt = new Date();
      parcel.trackingId = trackingId;

      logTracking(trackingId, "parcel_created");

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

    // patch rider
    app.patch("/parcels/:id", async (req, res) => {
      const {
        riderId,
        riderName,
        riderEmail,
        riderPhone,
        parcelId,
        trackingId,
      } = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          deliveryStatus: "diver_assigned",
          riderId: riderId,
          parcelId: parcelId,
          riderName: riderName,
          riderEmail: riderEmail,
          riderPhone: riderPhone,
        },
      };
      const result = await parcelsCollection.updateOne(query, updateDoc);
      // update rider information
      const riderQuery = { _id: new ObjectId(riderId) };
      const riderUpdatedDoc = {
        $set: {
          workStatus: "in_delivery",
        },
      };
      const riderResult = await ridersCollection.updateOne(
        riderQuery,
        riderUpdatedDoc,
      );

      // log tracking
      logTracking(trackingId, "diver_assigned");

      res.send(riderResult);
    });

    // TODO rename this to be specific like /parcel/:id/assign
    app.patch(
      "/riders/:id",
      verifyFireBaseToken,
      verifyAdmin,
      async (req, res) => {
        const status = req.body.status;
        const id = req.params.id;

        const query = {
          _id: new ObjectId(id),
        };

        const updatedDoc = {
          $set: {
            status: status,
            workStatus: "available",
          },
        };

        const result = await ridersCollection.updateOne(query, updatedDoc);

        if (status === "approved") {
          const email = req.body.email;

          console.log("Approved email:", email);

          const userQuery = { email };

          const updateUser = {
            $set: {
              role: "rider",
            },
          };

          const userResult = await userCollection.updateOne(
            userQuery,
            updateUser,
          );

          console.log("User update result:", userResult);
        }

        res.send(result);
      },
    );

    app.patch("/parcels/:id/status", async (req, res) => {
      const { deliveryStatus, riderId, trackingId } = req.body;

      const query = { _id: new ObjectId(req.params.id) };
      const updatedDoc = {
        $set: {
          deliveryStatus: deliveryStatus,
        },
      };

      if (deliveryStatus === "parcel_delivered") {
        // update rider deliveries status
        const riderQuery = { _id: new ObjectId(riderId) };
        const riderUpdatedDoc = {
          $set: {
            workStatus: "available",
          },
        };
        const riderResult = await ridersCollection.updateOne(
          riderQuery,
          riderUpdatedDoc,
        );
      }

      const result = await parcelsCollection.updateOne(query, updatedDoc);

      // log tracking
      logTracking(trackingId, deliveryStatus);

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
          parcelName: paymentInfo.parcelName,
          trackingId: paymentInfo.trackingId,
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

      // query for transaction id
      const transactionId = session.payment_intent;
      const query = { transactionId: transactionId };
      const PaymentExist = await paymentCollection.findOne(query);
      if (PaymentExist) {
        return res.send({
          message: "already exist",
          transactionId,
          trackingId: PaymentExist.trackingId,
        });
      }

      if (session.payment_status === "paid") {
        const id = session.metadata.parcelId;

        // use the previous tracking id created during the parcel created which was set to the session metadata during session creation
        const trackingId = session.metadata.trackingId;

        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: "paid",
            deliveryStatus: "pending-pickup",
          },
        };
        const result = await parcelsCollection.updateOne(query, update);

        const payment = {
          amount: session.amount_total / 100,
          currency: session.currency,
          customerEmail: session.customer_email,
          parcelId: session.metadata.parcelId,
          parcelName: session.metadata.parcelName,
          transactionId: session.payment_intent,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
          trackingId: trackingId,
        };

        if (session.payment_status === "paid") {
          const resultPayment = await paymentCollection.insertOne(payment);

          logTracking(trackingId, "parcel_paid");

          res.send({
            success: true,
            modifyParcel: result,
            trackingId: trackingId,
            transactionId: payment.transactionId,
            paymentInfo: resultPayment,
          });
        }
        return;
      }

      res.send({ success: false });
    });

    // payment related apis
    app.get("/payments", verifyFireBaseToken, async (req, res) => {
      const email = req.query.email;

      // if (!email) {
      //   return res.status(400).send({ message: "email query is required" });
      // }

      if (!req.decoded_email || email !== req.decoded_email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = {
        customerEmail: email,
      };

      const payments = await paymentCollection
        .find(query)
        .sort({ paidAt: -1 })
        .toArray();

      const result = await Promise.all(
        payments.map(async (payment) => {
          const parcel = await parcelsCollection.findOne({
            _id: new ObjectId(payment.parcelId),
          });

          return {
            ...payment,
            receiverName: parcel?.receiverName,
            receiverAddress: parcel?.receiverAddress,
            receiverDistrict: parcel?.receiverDistrict,
            receiverRegion: parcel?.receiverRegion,
            receiverContact: parcel?.receiverContact,
          };
        }),
      );

      res.send(result);
    });

    app.get('/riders/delivery-per-day', async (req, res) => {
      const email = req.query.email;
      //aggregate on parcel
      const pipeline = [
        {
          $match: {
            riderEmail: email,
            deliveryStatus: "parcel_delivered",
          },
        },
      ];
      const result = await parcelsCollection.aggregate(pipeline).toArray();
      res.send(result)
    })

    // riders related apis

    // riders created
    app.post("/riders", async (req, res) => {
      const rider = req.body;
      rider.status = "pending";
      rider.createAt = new Date();
      const result = await ridersCollection.insertOne(rider);
      res.send(result);
    });

    // find riders
    app.get("/riders", async (req, res) => {
      const { status, district, workStatus } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      if (district) {
        query.district = district;
      }
      if (workStatus) {
        query.workStatus = workStatus;
      }

      const cursor = ridersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Tracking related apis
    app.get("/trackings/:trackingId/logs", async (req, res) => {
      const trackingId = req.params.trackingId;
      const query = { trackingId };
      const result = await trackingCollection.find(query).toArray();
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
