import { Router } from 'express';
import { productQueries } from '../models/database-sqljs';

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
router.post('/', async (req, res) => {
    try {
        const result = await productQueries.createProduct(req.body);
        res.status(201).json({ id: result.lastID, message: 'Product created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        await productQueries.updateProduct(parseInt(req.params.id), req.body);
        res.json({ message: 'Product updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        await productQueries.deleteProduct(parseInt(req.params.id));
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
