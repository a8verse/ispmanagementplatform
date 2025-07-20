const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Define allowed roles for different levels of access
const canView = ['Admin', 'Manager', 'Team Member', 'Supervisor', 'Reseller'];
const canCreate = ['Admin', 'Manager', 'Team Member', 'Reseller'];
const canEdit = ['Admin', 'Manager', 'Reseller'];
const canDelete = ['Admin', 'Manager'];


// Chain the middleware: First check for a valid token, then check for the correct role.

// CREATE a new customer
router.post('/', authMiddleware, checkRole(canCreate), customerController.createCustomer);

// READ all customers
router.get('/', authMiddleware, checkRole(canView), customerController.getAllCustomers);

// READ a single customer by ID
router.get('/:id', authMiddleware, checkRole(canView), customerController.getCustomerById);

// UPDATE a customer by ID
router.put('/:id', authMiddleware, checkRole(canEdit), customerController.updateCustomer);

// DELETE a customer by ID
router.delete('/:id', authMiddleware, checkRole(canDelete), customerController.deleteCustomer);


module.exports = router;