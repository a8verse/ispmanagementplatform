const pool = require('../config/db.config');

// CREATE a new payment method
exports.createMethod = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send({ message: "Payment method name is required." });
    }
    try {
        const sql = 'INSERT INTO payment_methods (name, type) VALUES (?, ?)';
        const [result] = await pool.query(sql, [name, 'offline']);
        res.status(201).send({ message: "Payment method created successfully!", methodId: result.insertId });
    } catch (error) {
        res.status(500).send({ message: "Error creating payment method.", error: error.message });
    }
};

// READ all offline payment methods
exports.getAllMethods = async (req, res) => {
    try {
        const [methods] = await pool.query("SELECT * FROM payment_methods WHERE type = 'offline' ORDER BY name");
        res.status(200).send(methods);
    } catch (error) {
        res.status(500).send({ message: "Error fetching payment methods.", error: error.message });
    }
};

// UPDATE a payment method
exports.updateMethod = async (req, res) => {
    const { id } = req.params;
    const { name, is_active } = req.body;
    try {
        const sql = 'UPDATE payment_methods SET name = ?, is_active = ? WHERE id = ?';
        const [result] = await pool.query(sql, [name, is_active, id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Payment method not found." });
        }
        res.status(200).send({ message: "Payment method updated successfully." });
    } catch (error) {
        res.status(500).send({ message: "Error updating payment method.", error: error.message });
    }
};

// DELETE a payment method
exports.deleteMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM payment_methods WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Payment method not found." });
        }
        res.status(200).send({ message: "Payment method deleted successfully." });
    } catch (error) {
        res.status(500).send({ message: "Error deleting payment method.", error: error.message });
    }
};