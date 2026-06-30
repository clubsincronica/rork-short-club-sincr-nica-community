import { Router } from 'express';
import { productQueries } from '../models/database-sqljs';
import { authenticateJWT } from '../middleware/security';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await productQueries.getProducts();
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by provider
router.get('/provider/:userId', async (req, res) => {
    try {
        const products = await productQueries.getProductsByProvider(parseInt(req.params.userId));
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await productQueries.getProductById(parseInt(req.params.id));
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', authenticateJWT, async (req: any, res) => {
    try {
        const result = await productQueries.createProduct({
            ...req.body,
            providerId: req.user.userId
        });
        res.status(201).json({ id: result.lastID, message: 'Product created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', authenticateJWT, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);

        // IDOR Check
        const product = await productQueries.getProductById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.provider_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this product' });
        }

        await productQueries.updateProduct(id, req.body);
        res.json({ message: 'Product updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', authenticateJWT, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);

        // IDOR Check
        const product = await productQueries.getProductById(id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.provider_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this product' });
        }

        await productQueries.deleteProduct(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
