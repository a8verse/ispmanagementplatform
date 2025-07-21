// backend/src/middleware/role.middleware.js
const pool = require('../config/db.config');

// Middleware to check if the user has a broad role (e.g., 'Admin', 'Manager')
// This is the original checkRole, kept for compatibility if desired for simpler checks.
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(403).send({ message: "User ID not found in token. Authentication middleware might be missing or failed." });
    }

    try {
      const [rows] = await pool.query('SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [userId]);

      if (rows.length === 0) {
        return res.status(403).send({ message: "User not found or role not assigned." });
      }

      const userRole = rows[0].name;

      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        res.status(403).send({ message: `Forbidden: You do not have the required role. Your role: ${userRole}. Required: ${allowedRoles.join(', ')}` });
      }
    } catch (error) {
      console.error("Error verifying user role (DB query failed):", error);
      res.status(500).send({ message: "Error verifying user role." });
    }
  };
};

// NEW Middleware: checkPermission for granular access control
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(403).send({ message: "User ID not found in token. Authentication middleware might be missing or failed." });
    }

    try {
      // Query to get all permissions for the user's role
      const sql = `
        SELECT p.name AS permission_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ?;
      `;
      const [userPermissions] = await pool.query(sql, [userId]);

      const hasPermission = userPermissions.some(perm => perm.permission_name === requiredPermission);

      if (hasPermission) {
        next(); // User has the required permission, proceed
      } else {
        res.status(403).send({ message: `Forbidden: You do not have permission "${requiredPermission}" to perform this action.` });
      }
    } catch (error) {
      console.error(`Error checking permission "${requiredPermission}":`, error);
      res.status(500).send({ message: "Error checking user permission." });
    }
  };
};

module.exports = {
    checkRole,       // Export the broad role checker
    checkPermission  // Export the new granular permission checker
};