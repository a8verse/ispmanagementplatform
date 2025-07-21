// backend/src/routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware'); // General role check

// Routes for Role Management (Admin only, as per vision for managing roles)
router.post('/', authMiddleware, checkRole(['Admin']), roleController.createRole);
router.get('/', authMiddleware, checkRole(['Admin']), roleController.getAllRoles); // Admin to view all roles
router.get('/:id', authMiddleware, checkRole(['Admin']), roleController.getRoleById);
router.put('/:id', authMiddleware, checkRole(['Admin']), roleController.updateRole);
router.delete('/:id', authMiddleware, checkRole(['Admin']), roleController.deleteRole);

// Route to get all granular permissions (can be viewed by Admin for assigning)
router.get('/permissions/all', authMiddleware, checkRole(['Admin']), roleController.getAllPermissions);

module.exports = router;