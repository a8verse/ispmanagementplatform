// backend/src/controllers/paymentMethod.controller.js
const pool = require('../config/db.config');

exports.createMethod = async (req, res) => {
    const { name, is_active, is_approval_required } = req.body;
    if (!name) {
        return res.status(400).send({ message: "Payment method name is required." });
    }
    try {
        const sql = 'INSERT INTO payment_methods (name, type, is_active, is_approval_required) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [
            name,
            'offline',
            is_active !== undefined ? is_active : true,
            is_approval_required !== undefined ? is_approval_required : true
        ]);
        res.status(201).send({ message: "Payment method created successfully!", methodId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Payment method with this name already exists." });
        }
        console.error("Error creating payment method:", error);
        res.status(500).send({ message: "Error creating payment method.", error: error.message });
    }
};

exports.getAllMethods = async (req, res) => {
    try {
        const [methods] = await pool.query("SELECT id, name, type, is_active, is_approval_required FROM payment_methods WHERE type = 'offline' ORDER BY name");
        res.status(200).send(methods);
    } <<<<<<< Updated upstream catch (error) {
        console.error("Error fetching payment methods:", error);
        res.status(500).send({ message: "Error fetching payment methods.", error: error.message });
    }
};

exports.updateMethod = async (req, res) => {
    const { id } = req.params;
    const { name, is_active, is_approval_required } = req.body;

    let updates = [];
    let queryParams = [];

    if (name !== undefined) { updates.push('name = ?'); queryParams.push(name); }
    if (is_active !== undefined) { updates.push('is_active = ?'); queryParams.push(is_active); }
    if (is_approval_required !== undefined) { updates.push('is_approval_required = ?'); queryParams.push(is_approval_required); }

    if (updates.length === 0) {
        return res.status(400).send({ message: "No fields provided for update." });
    }

    try {
        const sql = `UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ?`;
        queryParams.push(id);

        const [result] = await pool.query(sql, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Payment method not found." });
        }
        res.status(200).send({ message: "Payment method updated successfully." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Payment method with this name already exists." });
        }
        console.error("Error updating payment method:", error);
        res.status(500).send({ message: "Error updating payment method.", error: error.message });
    }
};

exports.deleteMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const [inUse] = await pool.query('SELECT COUNT(*) AS count FROM transactions WHERE payment_method_id = ?', [id]);
        if (inUse[0].count > 0) {
            return res.status(409).send({ message: "Cannot delete payment method: it is linked to existing transactions." });
        }

        const [result] = await pool.query('DELETE FROM payment_methods WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Payment method not found." });
        }
        res.status(200).send({ message: "Payment method deleted successfully." });
    } catch (error) {
        console.error("Error deleting payment method:", error);
        res.status(500).send({ message: "Error deleting payment method.", error: error.message });
    }
};