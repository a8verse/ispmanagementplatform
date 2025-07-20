const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Manually trigger invoice generation (Admins only)
router.post('/generate-invoices', authMiddleware, checkRole(['Admin']), billingController.triggerInvoiceGeneration);

// Get invoices for a customer (Admins, Managers, and the customer themselves can view)
// We will add logic later for the customer to view their own.
router.get('/customer/:customerId', authMiddleware, checkRole(['Admin', 'Manager']), billingController.getInvoicesByCustomer);

module.exports = router;