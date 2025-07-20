const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

// Only Admins and Managers can manage plans
const canManagePlans = ['Admin', 'Manager'];

router.post('/', authMiddleware, checkRole(canManagePlans), planController.createPlan);
router.get('/', authMiddleware, planController.getAllPlans); // Let more roles view plans
router.put('/:id', authMiddleware, checkRole(canManagePlans), planController.updatePlan);
router.delete('/:id', authMiddleware, checkRole(canManagePlans), planController.deletePlan);

module.exports = router;