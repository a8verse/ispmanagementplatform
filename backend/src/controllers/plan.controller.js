const pool = require('../config/db.config');

// All CRUD operations for Plans
exports.createPlan = async (req, res) => {
    const { name, description, speed_mbps, data_limit_gb, fup_speed_mbps, price, duration_days } = req.body;
    // Basic validation
    if (!name || !speed_mbps || !price || !duration_days) {
        return res.status(400).send({ message: "Name, speed, price, and duration are required." });
    }
    try {
        const sql = 'INSERT INTO plans (name, description, speed_mbps, data_limit_gb, fup_speed_mbps, price, duration_days) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [name, description, speed_mbps, data_limit_gb, fup_speed_mbps, price, duration_days]);
        res.status(201).send({ message: "Plan created successfully!", planId: result.insertId });
    } catch (error) {
        res.status(500).send({ message: "Error creating plan.", error: error.message });
    }
};

exports.getAllPlans = async (req, res) => {
    try {
        const [plans] = await pool.query('SELECT * FROM plans ORDER BY price');
        res.status(200).send(plans);
    } catch (error) {
        res.status(500).send({ message: "Error fetching plans.", error: error.message });
    }
};

exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, description, speed_mbps, data_limit_gb, fup_speed_mbps, price, duration_days, is_active } = req.body;
    try {
        const sql = 'UPDATE plans SET name = ?, description = ?, speed_mbps = ?, data_limit_gb = ?, fup_speed_mbps = ?, price = ?, duration_days = ?, is_active = ? WHERE id = ?';
        const [result] = await pool.query(sql, [name, description, speed_mbps, data_limit_gb, fup_speed_mbps, price, duration_days, is_active, id]);
        if (result.affectedRows === 0) return res.status(404).send({ message: "Plan not found." });
        res.status(200).send({ message: "Plan updated successfully." });
    } catch (error) {
        res.status(500).send({ message: "Error updating plan.", error: error.message });
    }
};

exports.deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM plans WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).send({ message: "Plan not found." });
        res.status(200).send({ message: "Plan deleted successfully." });
    } catch (error) {
        // Handle case where plan is in use by subscriptions
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).send({ message: "Cannot delete plan. It is currently assigned to one or more subscriptions." });
        }
        res.status(500).send({ message: "Error deleting plan.", error: error.message });
    }
};