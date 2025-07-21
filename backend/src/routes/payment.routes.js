// backend/src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canRecordManualPayments = 'can_record_manual_payments';
const canViewPaymentApprovals = 'can_view_payment_approvals';
const canApprovePayments = 'can_approve_payments';

// Online Payment Routes (no specific permission check needed beyond auth for basic payments)
router.post('/create-order', authMiddleware, paymentController.createOrder);
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// Manual Payment Routes
router.post('/record-manual', authMiddleware, checkPermission(canRecordManualPayments), paymentController.recordManualPayment);
router.get('/pending-manual', authMiddleware, checkPermission(canViewPaymentApprovals), paymentController.getPendingManualPayments);
router.post('/:transactionId/approve-manual', authMiddleware, checkPermission(canApprovePayments), paymentController.approveManualPayment);
router.post('/:transactionId/reject-manual', authMiddleware, checkPermission(canApprovePayments), paymentController.rejectManualPayment);

module.exports = router;