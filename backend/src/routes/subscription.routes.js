// backend/src/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canManageSubscriptions = 'can_manage_subscriptions'; // Assuming this permission
const canCreateSubscription = 'can_create_subscription';
const canEditSubscription = 'can_edit_subscription';
const canDeleteSubscription = 'can_delete_subscription';
const canViewSubscriptions = 'can_view_subscriptions';

router.post('/', authMiddleware, checkPermission(canCreateSubscription), subscriptionController.createSubscription);
router.get('/customer/:customerId', authMiddleware, checkPermission(canViewSubscriptions), subscriptionController.getCustomerSubscriptions);
router.get('/:id', authMiddleware, checkPermission(canViewSubscriptions), subscriptionController.getSubscriptionById);
router.put('/:id', authMiddleware, checkPermission(canEditSubscription), subscriptionController.updateSubscription);
router.delete('/:id', authMiddleware, checkPermission(canDeleteSubscription), subscriptionController.deleteSubscription);

module.exports = router;