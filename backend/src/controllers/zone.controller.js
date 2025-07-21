// backend/src/controllers/zone.controller.js
const pool = require('../config/db.config');

// CREATE a new zone
exports.createZone = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).send({ message: "Zone name is required." });
    }

    try {
        const sql = 'INSERT INTO zones (name, description) VALUES (?, ?)';
        const [result] = await pool.query(sql, [name, description || null]);
        res.status(201).send({ message: "Zone created successfully!", zoneId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Zone with this name already exists." });
        }
        console.error("Error creating zone:", error);
        res.status(500).send({ message: "Error creating zone.", error: error.message });
    }
};

// READ all zones
exports.getAllZones = async (req, res) => {
    try {
        const [zones] = await pool.query("SELECT * FROM zones ORDER BY name");
        res.status(200).send(zones);
    } catch (error) {
        console.error("Error fetching zones:", error);
        res.status(500).send({ message: "Error fetching zones.", error: error.message });
    }
};

// READ a single zone by ID
exports.getZoneById = async (req, res) => {
    const { id } = req.params;
    try {
        const [zones] = await pool.query("SELECT * FROM zones WHERE id = ?", [id]);
        if (zones.length === 0) {
            return res.status(404).send({ message: "Zone not found." });
        }
        res.status(200).send(zones[0]);
    } catch (error) {
        console.error("Error fetching zone by ID:", error);
        res.status(500).send({ message: "Error fetching zone.", error: error.message });
    }
};

// UPDATE an existing zone
exports.updateZone = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    let updates = [];
    let queryParams = [];

    if (name !== undefined) { updates.push('name = ?'); queryParams.push(name); }
    if (description !== undefined) { updates.push('description = ?'); queryParams.push(description); }

    if (updates.length === 0) {
        return res.status(400).send({ message: "No fields provided for update." });
    }

    try {
        const sql = `UPDATE zones SET ${updates.join(', ')} WHERE id = ?`;
        queryParams.push(id);

        const [result] = await pool.query(sql, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Zone not found." });
        }
        res.status(200).send({ message: "Zone updated successfully." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Zone with this name already exists." });
        }
        console.error("Error updating zone:", error);
        res.status(500).send({ message: "Error updating zone.", error: error.message });
    }
};

// DELETE a zone
exports.deleteZone = async (req, res) => {
    const { id } = req.params;
    try {
        // Consider preventing deletion if zones are linked to customers or other entities
        const [customersInZone] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE zone_id = ?', [id]); // Assuming users can be linked to zones
        if (customersInZone[0].count > 0) {
            return res.status(409).send({ message: "Cannot delete zone: it is assigned to existing users. Reassign users before deleting." });
        }

        const [result] = await pool.query('DELETE FROM zones WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Zone not found." });
        }
        res.status(200).send({ message: "Zone deleted successfully." });
    } catch (error) {
        console.error("Error deleting zone:", error);
        res.status(500).send({ message: "Error deleting zone.", error: error.message });
    }
};