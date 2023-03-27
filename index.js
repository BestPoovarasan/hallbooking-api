const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv");
const URL = process.env.DB;
dotenv.config();

//<------- middleware------------>
app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
);

app.get('/', (req, res) => {
    res.send('Hall Booking API!')
})

// <---------------rooms booking----------------->
app.post("/room", async function (req, res) {
    try {
        // Open the Connection
        const connection = await mongoClient.connect(URL);
        // Select the DB
        const db = connection.db("hallbooking");
        // Select the Collection
        await db.collection("rooms").insertOne(request.body);
        // Close the connection
        await connection.close();
        res.json({
            message: "Rooms added successfully!",
        });
    } catch (error) {
        res.json({
            message: "Error",
        });
    }
});
// <---------------customer booking----------------->
app.post("/customer", async function (req, res) {
    try {
        // Open the Connection
        const connection = await mongoClient.connect(URL);
        // Select the DB
        const db = connection.db("hallbooking");
        const date = new Date();
        req.body.startdate = `${date.toDateString()}`
        req.body.starttime = `${date.getHours()}:${date.getMinutes()}`;
        const room = await db.collection("hallbooking").findOne({ Status: "not booked" });
        const a = await db.collection("rooms").updateOne({ _id: mongodb.ObjectId(room._id) }, { $set: { "Status": "booked" } });
        if (a) {
            req.body.room_id = room._id;
            await db.collection("customers").insertOne(req.body);
            res.json({
                message: "added successfully"
            })
        }
        else {
            res.json({
                message: "No available rooms"
            })
        }
        await connection.close();
    }
    catch (error) {
        res.status(404).json({
            message: "Rooms Not found"
        })
    }
})

// <---------------display all customers ----------------->
app.get("/customers", async function (request, response) {
  try {
    // Open the connection
    const connection = await mongoClient.connect(URL);
    // Select DB
    const db = connection.db("hallbooking");
    // select the collection and do operation
    let customers = await db.collection("customers").find().toArray();
    // Close the connection
    await connection.close();
    response.json(customers);
  } catch (error) {
    console.log(error);
  }
});

// <---------------display all Rooms ----------------->
app.get("/rooms", async function (request, response) {
    try {
      // Open the connection
      const connection = await mongoClient.connect(URL);
      // Select DB
      const db = connection.db("hallbooking");
      // select the collection and do operation
      let rooms = await db.collection("rooms").find().toArray();
      // Close the connection
      await connection.close();
      response.json(rooms);
    } catch (error) {
      console.log(error);
    }
  });

// <---------------get customer booked rooms ----------------->
app.get("/roomsbooked", async function (request, response) {
    try {
      const pipeline = [
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "roomID",
            as: "customer",
          },
        },
        {
          $addFields: {
            reservation: {
              $cond: [
                {
                  $eq: ["$customer", []],
                },
                "Not booked",
                "Booked",
              ],
            },
          },
        },
      ]
      // Open the connection
      const connection = await mongoClient.connect(URL);
      // Select DB
      const db = connection.db("hallbooking");
      const result =await db
        .collection("rooms")
        .aggregate(pipeline)
        .toArray();
      response.json(result);
    } catch (error) {
      console.log(error);
    }
  });


app.listen(process.env.PORT || 3001);