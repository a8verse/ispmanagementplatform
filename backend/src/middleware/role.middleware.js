const pool = require('../config/db.config');

// This middleware checks if the user's role is in the allowedRoles array
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    const userId = req.user.id; // From the auth.middleware

    try {
      // Fetch the user's role_id from the database to ensure it's current
      const [rows] = await pool.query('SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [userId]);

      if (rows.length === 0) {
        return res.status(403).send({ message: "User not found." });
      }

      const userRole = rows[0].name;

      if (allowedRoles.includes(userRole)) {
        next(); // Role is allowed, proceed to the controller
      } else {
        res.status(403).send({ message: "Forbidden: You do not have the required permissions." });
      }
    } catch (error) {
      res.status(500).send({ message: "Error verifying user role." });
    }
  };
};

module.exports = checkRole;