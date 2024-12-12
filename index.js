const express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
app.use(express.json());

const stockApiUrl = process.env.STOCK_API_URL;


app.get("/api/ping", (req, res) => {
  res.send("PONG");
});

app.post("/api/order", async (req, res) => {
  console.log("Route /api/order");

  try {
    const { products } = req.body;
    console.log("Requête:", products);

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: "Liste de produits invalide",
      });
    }

    for (const product of products) {
      try {
        const stockResponse = await axios.get(`${stockApiUrl}/api/stock/${product.productId}`);
        const availableQuantity = stockResponse.data.quantity;

        if (availableQuantity < product.quantity) {
          return res.status(400).json({
            message: `Produit ${product.productId}:quantité insuffisante (stock: ${availableQuantity}, demandé: ${product.quantity})`,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la gestion du stock:", error);
        return res.status(500).json({
          message: "Erreur lors de la gestion du stock",
          details: error.message,
        });
      }
    }

    const orderId = uuidv4();
    const order = {
      id: orderId,
      status: "PENDING",
      products: products,
    };

    return res.status(200).json({ id: orderId });

  } catch (error) {
    console.error("Erreur création de commande", error);
    return res.status(500).json({
      message: "Erreur interne du serveur",
      details: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`port ${PORT} actif`);
});
module.exports = app;
