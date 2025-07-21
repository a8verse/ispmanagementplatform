// backend/src/controllers/role.controller.js
const pool = require('../config/db.config');

// CREATE a new role with assigned permissions
exports.createRole = async (req, res) => {
    const { name, permission_ids } = req.body; // permission_ids is an array of permission IDs

    if (!name) {
        return res.status(400).send({ message: "Role name is required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert role
        const [roleResult] = await connection.query('INSERT INTO roles (name) VALUES (?)', [name]);
        const roleId = roleResult.insertId;

        // 2. Assign permissions
        if (permission_ids && permission_ids.length > 0) {
            const permissionValues = permission_ids.map(permId => [roleId, permId]);
            await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [permissionValues]);
        }

        await connection.commit();
        res.status(201).send({ message: "Role created successfully!", roleId: roleId });

    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Role with this name already exists." });
        }
        console.error("Error creating role:", error);
        res.status(500).send({ message: "Error creating role.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET all roles with their assigned permissions
exports.getAllRoles = async (req, res) => {
    try {
        const sql = `
            SELECT
                r.id AS role_id,
                r.name AS role_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', p.id, 'name', p.name, 'description', p.description, 'category', p.category)
                ) AS permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name
            ORDER BY r.name;
        `;
        const [roles] = await pool.query(sql);

        // Map null permissions to empty array for roles with no permissions
        const formattedRoles = roles.map(role => ({
            ...role,
            permissions: role.permissions ? role.permissions : []
        }));

        res.status(200).send(formattedRoles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).send({ message: "Error fetching roles.", error: error.message });
    }
};

// GET a single role by ID with its permissions
exports.getRoleById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT
                r.id AS role_id,
                r.name AS role_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', p.id, 'name', p.name, 'description', p.description, 'category', p.category)
                ) AS permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = ?
            GROUP BY r.id, r.name;
        `;
        const [roles] = await pool.query(sql, [id]);

        if (roles.length === 0) {
            return res.status(404).send({ message: "Role not found." });
        }

        const role = {
            ...roles[0],
            permissions: roles[0].permissions ? roles[0].permissions : []
        };

        res.status(200).send(role);
    } catch (error) {
        console.error("Error fetching role by ID:", error);
        res.status(500).send({ message: "Error fetching role.", error: error.message });
    }
};

// UPDATE a role's name and its assigned permissions
exports.updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, permission_ids } = req.body; // permission_ids is an array of permission IDs

    if (!name) {
        return res.status(400).send({ message: "Role name is required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update role name
        const [roleResult] = await connection.query('UPDATE roles SET name = ? WHERE id = ?', [name, id]);
        if (roleResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Role not found." });
        }

        // 2. Clear existing permissions for this role
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        // 3. Insert new permissions
        if (permission_ids && permission_ids.length > 0) {
            const permissionValues = permission_ids.map(permId => [id, permId]);
            await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [permissionValues]);
        }

        await connection.commit();
        res.status(200).send({ message: "Role updated successfully!" });

    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Role with this name already exists." });
        }
        console.error("Error updating role:", error);
        res.status(500).send({ message: "Error updating role.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE a role
exports.deleteRole = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if any users are assigned to this role
        const [usersCount] = await connection.query('SELECT COUNT(*) AS count FROM users WHERE role_id = ?', [id]);
        if (usersCount[0].count > 0) {
            await connection.rollback();
            return res.status(409).send({ message: "Cannot delete role: it is currently assigned to active users. Reassign users before deleting." });
        }

        // 2. Deleting role_permissions is handled by ON DELETE CASCADE on role_id
        // 3. Delete the role itself
        const [result] = await connection.query('DELETE FROM roles WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Role not found." });
        }

        await connection.commit();
        res.status(200).send({ message: "Role deleted successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting role:", error);
        res.status(500).send({ message: "Error deleting role.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET all available permissions (for populating checkboxes in frontend)
exports.getAllPermissions = async (req, res) => {
    try {
        const [permissions] = await pool.query("SELECT id, name, description, category FROM permissions ORDER BY category, name");
        res.status(200).send(permissions);
    } catch (error) {
        console.error("Error fetching permissions:", error);
        res.status(500).send({ message: "Error fetching permissions.", error: error.message });
    }
};