// backend/src/routes/paymentMethod.routes.js
const express = require('express');
const router = express.Router();
const methodController = require('../controllers/paymentMethod.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canManageMethods = 'can_manage_payment_methods';
const canViewMethods = 'can_view_payment_methods'; // Assuming a permission for viewing methods

router.post('/', authMiddleware, checkPermission(canManageMethods), methodController.createMethod);
router.get('/', authMiddleware, checkPermission(canViewMethods), methodController.getAllMethods);
router.put('/:id', authMiddleware, checkPermission(canManageMethods), methodController.updateMethod);
router.delete('/:id', authMiddleware, checkPermission(canManageMethods), methodController.deleteMethod); // Delete might be more restricted to Admin, but using canManageMethods for now

module.exports = router;