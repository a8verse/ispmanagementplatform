const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Razorpay Online Payment Routes (Existing)
router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// NEW Manual Payment Routes
// Roles for manual payment recording: Admin, Manager, Team Member, Reseller (e.g., collection agents)
router.post('/record-manual', authMiddleware, checkRole(['Admin', 'Manager', 'Team Member', 'Reseller']), paymentController.recordManualPayment);

// Roles for viewing and approving/rejecting manual payments: Admin, Manager
router.get('/pending-manual', authMiddleware, checkRole(['Admin', 'Manager']), paymentController.getPendingManualPayments);
router.post('/:transactionId/approve-manual', authMiddleware, checkRole(['Admin', 'Manager']), paymentController.approveManualPayment);
router.post('/:transactionId/reject-manual', authMiddleware, checkRole(['Admin', 'Manager']), paymentController.rejectManualPayment);

module.exports = router;