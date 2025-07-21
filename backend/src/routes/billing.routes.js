// backend/src/routes/billing.routes.js
const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

// Permissions for billing operations
const canGenerateInvoices = 'can_generate_invoices';
const canViewBilling = 'can_view_billing';

// Route to manually trigger invoice generation (Admin only)
router.post('/generate-invoices', authMiddleware, checkPermission(canGenerateInvoices), billingController.generateInvoices);

// Route to retrieve all invoices for a specific customer (Admin, Manager, Reseller)
router.get('/customer/:customerId', authMiddleware, checkPermission(canViewBilling), billingController.getCustomerInvoices);

module.exports = router;