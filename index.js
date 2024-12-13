const express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
app.use(express.json());

const stockApiUrl = process.env.STOCK_API_URL || "http://localhost:3000";

app.post("/api/order", async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Liste de produits invalide" });
    }
    const stockReservations = [];
    for (const product of products) {
      if (!product.productId || !product.quantity) {
        return res.status(400).json({
          message: `Produit invalide : ${JSON.stringify(product)}`,
        });
      }
      try {
        const stockResponse = await axios.get(
          `${stockApiUrl}/api/stock/${product.productId}`
        );

        const availableQuantity = stockResponse.data.quantity;

        if (availableQuantity < product.quantity) {
          await Promise.all(
            stockReservations.map(reservation =>
              axios.post(`${stockApiUrl}/api/stock/${reservation.productId}/movement`, {
                quantity: -reservation.quantity,
                type: 'CANCEL_RESERVATION'
              })
            )
          );

          return res.status(400).json({
            message: `Stock insuffisant pour le produit ${product.productId} (stock: ${availableQuantity}, demandé: ${product.quantity})`,
          });
        }
        const reservationResponse = await axios.post(
          `${stockApiUrl}/api/stock/${product.productId}/movement`,
          {
            quantity: -product.quantity,
            type: 'Reserve'
          }
        );

        stockReservations.push({
          productId: product.productId,
          quantity: product.quantity
        });

      } catch (error) {
        console.error(`Erreur de gestion du stock : ${error.message}`);
        return res.status(500).json({
          message: `Erreur lors de la vérification du produit ${product.productId}`,
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

    console.log(`Commande créée avec succès : ${orderId}`);
    return res.status(200).json({
      id: orderId,
      message: "Commande créée avec succès",
    });
  } catch (error) {
    console.error("Erreur interne lors de la création de la commande", error);
    return res.status(500).json({
      message: "Erreur interne du serveur",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;