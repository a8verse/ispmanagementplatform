// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');
const checkPermission = require('../middleware/role.middleware').checkPermission; // Import specific permission checker

// User Management requires 'can_manage_users' permission (typically Admin/Super Admin)
// Note: We might allow 'Admin' role to have 'can_manage_users' permission.

// Create a new user (requires 'can_manage_users' permission)
router.post('/', authMiddleware, checkPermission('can_manage_users'), userController.createUser);

// Get all users (requires 'can_manage_users' permission to view list)
router.get('/', authMiddleware, checkPermission('can_manage_users'), userController.getAllUsers);

// Get a single user by ID (requires 'can_manage_users' or self-access)
// For simplicity, current checkPermission is broad. Later, add self-access logic if needed.
router.get('/:id', authMiddleware, checkPermission('can_manage_users'), userController.getUserById);

// Update a user by ID (requires 'can_manage_users' permission)
router.put('/:id', authMiddleware, checkPermission('can_manage_users'), userController.updateUser);

// Delete a user by ID (requires 'can_manage_users' permission, with specific check in controller)
router.delete('/:id', authMiddleware, checkPermission('can_manage_users'), userController.deleteUser);

module.exports = router;