// backend/src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canManageUsers = 'can_manage_users'; // Permission for managing users

router.post('/', authMiddleware, checkPermission(canManageUsers), userController.createUser);
router.get('/', authMiddleware, checkPermission(canManageUsers), userController.getAllUsers);
router.get('/:id', authMiddleware, checkPermission(canManageUsers), userController.getUserById);
router.put('/:id', authMiddleware, checkPermission(canManageUsers), userController.updateUser);
router.delete('/:id', authMiddleware, checkPermission(canManageUsers), userController.deleteUser);

module.exports = router;