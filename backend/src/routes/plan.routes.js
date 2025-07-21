// backend/src/routes/plan.routes.js
const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT: Use destructuring

// Permissions needed for plan management
const canManagePlans = 'can_manage_plan'; // Ensure this matches a permission name in your DB
const canCreatePlan = 'can_create_plan';
const canEditPlan = 'can_edit_plan';
const canDeletePlan = 'can_delete_plan';
const canViewPlans = 'can_view_plans'; // Ensure this matches a permission name in your DB

// Route to create a new plan (requires 'can_create_plan' permission)
router.post('/', authMiddleware, checkPermission(canCreatePlan), planController.createPlan);

// Route to get all plans (requires 'can_view_plans' permission)
router.get('/', authMiddleware, checkPermission(canViewPlans), planController.getAllPlans);

// Route to get a single plan by ID (requires 'can_view_plans' permission)
router.get('/:id', authMiddleware, checkPermission(canViewPlans), planController.getPlanById);

// Route to update a plan by ID (requires 'can_edit_plan' permission)
router.put('/:id', authMiddleware, checkPermission(canEditPlan), planController.updatePlan);

// Route to delete a plan by ID (requires 'can_delete_plan' permission)
router.delete('/:id', authMiddleware, checkPermission(canDeletePlan), planController.deletePlan);

module.exports = router;