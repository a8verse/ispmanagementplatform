// backend/src/routes/plan.routes.js
const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canCreatePlan = 'can_create_plan';
const canEditPlan = 'can_edit_plan';
const canDeletePlan = 'can_delete_plan';
const canViewPlans = 'can_view_plans';

router.post('/', authMiddleware, checkPermission(canCreatePlan), planController.createPlan);
router.get('/', authMiddleware, checkPermission(canViewPlans), planController.getAllPlans);
router.get('/:id', authMiddleware, checkPermission(canViewPlans), planController.getPlanById);
router.put('/:id', authMiddleware, checkPermission(canEditPlan), planController.updatePlan);
router.delete('/:id', authMiddleware, checkPermission(canDeletePlan), planController.deletePlan);

module.exports = router;