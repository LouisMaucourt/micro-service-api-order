const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class OrderController {
    async createOrder(req, res) {
        console.log("createOrder appelée");
        console.log("Corps:", req.body);
        try {
            const { products } = req.body;
            console.log("Requête:", products);

            if (!products || !Array.isArray(products) || products.length === 0) {
                return res.status(400).json({
                    message: "Liste de produits invalide"
                });
            }

            for (const product of products) {
                try {
                    const stockResponse = await stockApi.get(`/api/stock/${product.productId}`);
                    const availableQuantity = stockResponse.data.quantity;
                    if (availableQuantity < product.quantity) {
                        return res.status(400).json({
                            message: `Produit ${product.productId}: pas de quantité suffisante (stock: ${availableQuantity}, demandé: ${product.quantity})`
                        });
                    }
                    return res.status(200).json({ id: uuidv4() });
                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
            }

            const stockMovements = products.map(product => ({
                productId: product.productId,
                quantity: product.quantity,
                status: 'Reserve'
            }));

            for (const movement of stockMovements) {
                try {
                    await stockApi.post(`/stock/${movement.productId}/movement`, movement);
                } catch (error) {
                    console.error('Erreur de mouvement de stock:', error.message);
                    return res.status(400).json({
                        message: `Impossible de réserver le stock pour ${movement.productId}`
                    });
                }
            }
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
    }
}

module.exports = new OrderController();