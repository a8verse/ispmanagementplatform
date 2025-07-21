// backend/src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT: Use destructuring

// Permissions needed for customer management
const canViewCustomers = 'can_view_customers';
const canCreateCustomer = 'can_create_customer';
const canEditCustomer = 'can_edit_customer';
const canDeleteCustomer = 'can_delete_customer'; // Assuming you have this permission defined

// Routes for Customer Management
router.post('/', authMiddleware, checkPermission(canCreateCustomer), customerController.createCustomer);
router.get('/', authMiddleware, checkPermission(canViewCustomers), customerController.getAllCustomers);
router.get('/:id', authMiddleware, checkPermission(canViewCustomers), customerController.getCustomerById); // Can be more granular for view self
router.put('/:id', authMiddleware, checkPermission(canEditCustomer), customerController.updateCustomer);
router.delete('/:id', authMiddleware, checkPermission(canDeleteCustomer), customerController.deleteCustomer);

module.exports = router;