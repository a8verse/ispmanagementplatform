// backend/src/routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canManageRoles = 'can_manage_roles'; // Permission for managing roles

router.post('/', authMiddleware, checkPermission(canManageRoles), roleController.createRole);
router.get('/', authMiddleware, checkPermission(canManageRoles), roleController.getAllRoles);
router.get('/:id', authMiddleware, checkPermission(canManageRoles), roleController.getRoleById);
router.put('/:id', authMiddleware, checkPermission(canManageRoles), roleController.updateRole);
router.delete('/:id', authMiddleware, checkPermission(canManageRoles), roleController.deleteRole);

// Route to get all granular permissions (for populating checkboxes in frontend)
router.get('/permissions/all', authMiddleware, checkPermission(canManageRoles), roleController.getAllPermissions); // Admin needs this to manage roles

module.exports = router;