// backend/src/controllers/user.controller.js
const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');

// CREATE a new user
exports.createUser = async (req, res) => {
    const { username, password, email, full_name, role_id, zone_id } = req.body; // role_id is now manually assigned
    const created_by = req.user.id; // User who is creating this new user

    if (!username || !password || !email || !role_id) {
        return res.status(400).send({ message: "Username, password, email, and role are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `
            INSERT INTO users (username, password_hash, email, full_name, role_id, zone_id, created_at, is_active, last_login)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, TRUE, NULL)
        `;
        const [result] = await pool.query(sql, [username, hashedPassword, email, full_name, role_id, zone_id || null]);
        res.status(201).send({ message: "User created successfully!", userId: result.insertId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Username or email already exists." });
        }
        console.error("Error creating user:", error);
        res.status(500).send({ message: "Error creating user.", error: error.message });
    }
};

// GET all users (with role and zone details)
exports.getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT
                u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.last_login,
                r.id AS role_id, r.name AS role_name,
                z.id AS zone_id, z.name AS zone_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN zones z ON u.zone_id = z.id
            ORDER BY u.username;
        `;
        const [users] = await pool.query(sql);
        res.status(200).send(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Error fetching users.", error: error.message });
    }
};

// GET a single user by ID (with role and zone details)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT
                u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.last_login,
                r.id AS role_id, r.name AS role_name,
                z.id AS zone_id, z.name AS zone_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN zones z ON u.zone_id = z.id
            WHERE u.id = ?;
        `;
        const [users] = await pool.query(sql, [id]);
        if (users.length === 0) {
            return res.status(404).send({ message: "User not found." });
        }
        res.status(200).send(users[0]);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).send({ message: "Error fetching user.", error: error.message });
    }
};

// UPDATE an existing user's details
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, full_name, role_id, zone_id, is_active, password } = req.body;

    let updates = [];
    let queryParams = [];

    if (username !== undefined) { updates.push('username = ?'); queryParams.push(username); }
    if (email !== undefined) { updates.push('email = ?'); queryParams.push(email); }
    if (full_name !== undefined) { updates.push('full_name = ?'); queryParams.push(full_name); }
    if (role_id !== undefined) { updates.push('role_id = ?'); queryParams.push(role_id); }
    if (zone_id !== undefined) { updates.push('zone_id = ?'); queryParams.push(zone_id || null); } // Allow setting zone to null
    if (is_active !== undefined) { updates.push('is_active = ?'); queryParams.push(is_active); }
    if (password !== undefined && password !== '') { // Allow password reset
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password_hash = ?');
        queryParams.push(hashedPassword);
    }

    if (updates.length === 0) {
        return res.status(400).send({ message: "No fields provided for update." });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP'); // Update timestamp on every change

    try {
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        queryParams.push(id);

        const [result] = await pool.query(sql, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "User not found." });
        }
        res.status(200).send({ message: "User updated successfully!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Username or email already exists." });
        }
        console.error("Error updating user:", error);
        res.status(500).send({ message: "Error updating user.", error: error.message });
    }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deletion of self (if logged in user tries to delete their own account)
        if (req.user.id === Number(id)) {
            return res.status(403).send({ message: "Forbidden: You cannot delete your own user account." });
        }
        // Consider preventing deletion if user has associated records (e.g., recorded payments, activated subscriptions)
        // For now, a simple delete
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "User not found." });
        }
        res.status(200).send({ message: "User deleted successfully!" });
    } catch (error) {
        // Handle constraint violation if user has related data (e.g., foreign key constraints)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).send({ message: "Cannot delete user: this user is linked to other records (e.g., created customers, activated subscriptions). Deactivate the user instead." });
        }
        console.error("Error deleting user:", error);
        res.status(500).send({ message: "Error deleting user.", error: error.message });
    }
};