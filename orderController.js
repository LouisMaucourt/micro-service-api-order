// api/order.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const { products } = req.body;
            console.log("Requête:", products);

            if (!products || !Array.isArray(products) || products.length === 0) {
                return res.status(400).json({
                    message: "Liste de produits invalide"
                });
            }

            // Perform your stock checking logic here (use your actual stockApi)
            for (const product of products) {
                try {
                    const stockResponse = await axios.get(`/api/stock/${product.productId}`);
                    const availableQuantity = stockResponse.data.quantity;
                    if (availableQuantity < product.quantity) {
                        return res.status(400).json({
                            message: `Produit ${product.productId}: pas de quantité suffisante (stock: ${availableQuantity}, demandé: ${product.quantity})`
                        });
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
            }

            // If all products are valid, create order
            const orderId = uuidv4();
            const order = {
                id: orderId,
                status: 'PENDING',
                products: products
            };

            return res.status(200).json({ id: orderId });

        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            return res.status(500).json({
                message: 'Erreur interne du serveur',
                details: error.message
            });
        }
    } else {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
};
