// Add Express
const express = require("express");

// Initialize Express
const app = express();

// Create GET request
app.get("/api/ping", (req, res) => {
  res.send("PONG");
});

// Initialize server
app.listen(3000, () => {
  console.log("Running on port 3000.");
});

module.exports = app;