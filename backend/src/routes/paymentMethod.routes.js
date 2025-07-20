const express = require('express');
const router = express.Router();
const methodController = require('../controllers/paymentMethod.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Only Admins can manage payment methods
const canManageMethods = ['Admin'];

// Allow more roles to view the methods (e.g., collection agents)
const canViewMethods = ['Admin', 'Manager', 'Team Member'];

router.post('/', authMiddleware, checkRole(canManageMethods), methodController.createMethod);
router.get('/', authMiddleware, checkRole(canViewMethods), methodController.getAllMethods);
router.put('/:id', authMiddleware, checkRole(canManageMethods), methodController.updateMethod);
router.delete('/:id', authMiddleware, checkRole(canManageMethods), methodController.deleteMethod);

module.exports = router;