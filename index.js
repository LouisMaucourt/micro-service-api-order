const express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();
app.use(express.json());

app.get('/api/ping', async (req, res) => {
  res.send('pong')
});

const stockApiUrl = "https://microservice-stock-nine.vercel.app"

app.post("/api/order", async (req, res) => {
  try {
    const products = req.body;
    console.log('Produits reçus :', products);

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
        console.log(`Stock produit : ${product.productId}`);
        const stockResponse = await axios.post(
          `${stockApiUrl}/api/stock/${product.productId}/movement`,
          {
            quantity: product.quantity,
            type: 'Reserve',
          }
        );
        console.log('Réponse stock:', stockResponse.data);
        const availableQuantity = stockResponse.data.quantity;

        if (availableQuantity < product.quantity) {
          await Promise.all(
            stockReservations.map(reservation =>
              axios.post(`${stockApiUrl}/api/stock/${reservation.productId}/movement`, {
                quantity: -reservation.quantity,
                type: 'Removal'
              })
            )
          );
          return res.status(400).json({
            message: `Stock insuffisant pour le produit ${product.productId} (stock: ${availableQuantity}, demandé: ${product.quantity})`,
          });
        }
        console.log(`Vérification stock - URL complète : ${stockApiUrl}`);
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
app.post("/api/shipping", async (req, res) => {
  try {
    const { orderId, nbProducts } = req.body;
    if (!orderId || nbProducts === undefined) {
      return res.status(400).json({
        message: "Livraison invalides",
        details: "L'orderId et le productCount sont requis"
      });
    }

    console.log(`Notification commande ${orderId}`);
    console.log(`Nombre total de produits : ${nbProducts}`);

    return res.status(200).json({
      message: "Notification de livraison succes",
      orderId: orderId,
      nbProducts: nbProducts
    });

  } catch (error) {
    console.error("Erreur lors de la notification de livraison", error);
    return res.status(500).json({
      message: "Erreur interne lors de la notification de livraison",
      details: error.message
    });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = app;