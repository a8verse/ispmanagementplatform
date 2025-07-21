// backend/src/routes/paymentMethod.routes.js
const express = require('express');
const router = express.Router();
const methodController = require('../controllers/paymentMethod.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

const canManageMethods = ['Admin', 'Manager']; // Managers can also manage methods
const canViewMethods = ['Admin', 'Manager', 'Team Member', 'Reseller']; // Collection agents can view

router.post('/', authMiddleware, checkRole(canManageMethods), methodController.createMethod);
router.get('/', authMiddleware, checkRole(canViewMethods), methodController.getAllMethods);
router.put('/:id', authMiddleware, checkRole(canManageMethods), methodController.updateMethod);
router.delete('/:id', authMiddleware, checkRole(['Admin']), methodController.deleteMethod);

module.exports = router;