// backend/src/routes/zone.routes.js
const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, checkPermission } = require('../middleware/role.middleware'); // CORRECT IMPORT

const canManageZones = 'can_manage_zones'; // Assuming you will add this permission

router.post('/', authMiddleware, checkPermission(canManageZones), zoneController.createZone);
router.get('/', authMiddleware, checkPermission(canManageZones), zoneController.getAllZones); // Assuming view zones also needs permission
router.put('/:id', authMiddleware, checkPermission(canManageZones), zoneController.updateZone); // Assuming update zones also needs permission
router.delete('/:id', authMiddleware, checkPermission(canManageZones), zoneController.deleteZone); // Assuming delete zones also needs permission

module.exports = router;