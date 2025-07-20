const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkRole = require('../middleware/role.middleware');

const canManageZones = ['Admin', 'Manager'];

router.post('/', authMiddleware, checkRole(canManageZones), zoneController.createZone);
router.get('/', authMiddleware, zoneController.getAllZones);

module.exports = router;