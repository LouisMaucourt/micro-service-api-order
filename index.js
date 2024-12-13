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

    const stockReservations = [];

    for (const product of products) {
      try {
        console.log(`Stock produit : ${product.productId}`);
        console.log('product quantité', product.quantity)
        console.log('product quantité', product.quantity)
        const stockResponse = await axios.post(
          `${stockApiUrl}/api/stock/${product.productId}/movement`,
          {
            quantity: product.quantity,
            status: 'Reserve',
            productId: product.productId,
          }
        );


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
    orders[orderId] = order;


    console.log(`Commande créée avec succès : ${orderId}`);
    return res.status(200).json({
      id: orderId,
      message: "Commande créée avec succès",
      status: order.status
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

const orders = {};

app.get("/api/order/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = orders[orderId];

    if (!order) {
      return res.status(404).json({
        message: "La commande n'existe pas",
        orderId: orderId,
      });
    }

    const orderDetails = {
      id: order.id,
      status: order.status,
      products: order.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
      })),
    };

    return res.status(200).json(orderDetails);

  } catch (error) {
    console.error("Erreur lors de la récupération de la commande", error);
    return res.status(500).json({
      message: "Erreur interne du serveur",
      details: error.message,
    });
  }
});







const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = app;