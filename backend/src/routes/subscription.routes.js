// backend/src/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

const canManageSubscriptions = ['Admin', 'Manager'];
const canViewSubscriptions = ['Admin', 'Manager', 'Reseller'];

router.post('/', authMiddleware, checkRole(canManageSubscriptions), subscriptionController.createSubscription);
router.get('/customer/:customerId', authMiddleware, checkRole(canViewSubscriptions), subscriptionController.getCustomerSubscriptions);
router.get('/:id', authMiddleware, checkRole(canViewSubscriptions), subscriptionController.getSubscriptionById);
router.put('/:id', authMiddleware, checkRole(canManageSubscriptions), subscriptionController.updateSubscription);
router.delete('/:id', authMiddleware, checkRole(['Admin']), subscriptionController.deleteSubscription);

module.exports = router;