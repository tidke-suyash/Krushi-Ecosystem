const express = require('express');
const router = express.Router();
const setuController = require('../controllers/setu.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

// Public/optional browsing
router.get('/setu/products', optionalAuth, setuController.getProducts);
router.get('/setu/products/:id', optionalAuth, setuController.getProductById);

// Protected seller & buyer endpoints
router.post('/setu/products', authenticate, setuController.createProduct);
router.patch('/setu/products/:id', authenticate, setuController.updateProduct);
router.delete('/setu/products/:id', authenticate, setuController.deleteProduct);
router.get('/setu/my-listings', authenticate, setuController.getMyListings);
router.get('/setu/saved', authenticate, setuController.getSavedProducts);
router.post('/setu/saved/:id', authenticate, setuController.toggleSaveProduct);
router.get('/setu/orders', authenticate, setuController.getOrders);
router.post('/setu/orders', authenticate, setuController.createOrder);

module.exports = router;
