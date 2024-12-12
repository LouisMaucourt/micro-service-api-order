const express = require("express");
const orderController = require("./orderController");

const app = express();

app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.send("PONG");
});

app.post("/api/order", (req, res) => {
  console.log("Route /api/order atteinte");
  orderController.createOrder(req, res);
});

app.listen(3000, () => {
  console.log("Running on port 3000.");
});

module.exports = app;