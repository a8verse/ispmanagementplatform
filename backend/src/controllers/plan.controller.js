// backend/src/controllers/plan.controller.js
const pool = require('../config/db.config');

exports.createPlan = async (req, res) => {
    const { name, speed_mbps, data_limit_gb, price, duration_days, is_active,
            plan_code, include_gst, sac_code, show_on_customer_dashboard } = req.body;
    if (!name || !speed_mbps || !price || !duration_days) {
        return res.status(400).send({ message: "Plan name, speed, price, and duration are required." });
    }
    try {
        const sql = `
            INSERT INTO plans (name, speed_mbps, data_limit_gb, price, duration_days, is_active,
                               plan_code, include_gst, sac_code, show_on_customer_dashboard)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [
            name,
            speed_mbps,
            data_limit_gb !== undefined && data_limit_gb !== '' ? data_limit_gb : null,
            price,
            duration_days,
            is_active !== undefined ? is_active : true,
            plan_code || null,
            include_gst !== undefined ? include_gst : true,
            sac_code || null,
            show_on_customer_dashboard !== undefined ? show_on_customer_dashboard : false
        ]);
        res.status(201).send({ message: "Plan created successfully!", planId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Plan with this name or code already exists." });
        }
        console.error("Error creating plan:", error);
        res.status(500).send({ message: "Error creating plan.", error: error.message });
    }
};

exports.getAllPlans = async (req, res) => {
    try {
        const [plans] = await pool.query("SELECT id, name, speed_mbps, data_limit_gb, price, duration_days, is_active, plan_code, include_gst, sac_code, show_on_customer_dashboard FROM plans ORDER BY name");
        res.status(200).send(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).send({ message: "Error fetching plans.", error: error.message });
    }
};

exports.getPlanById = async (req, res) => {
    const { id } = req.params;
    try {
        const [plans] = await pool.query("SELECT id, name, speed_mbps, data_limit_gb, price, duration_days, is_active, plan_code, include_gst, sac_code, show_on_customer_dashboard FROM plans WHERE id = ?", [id]);
        if (plans.length === 0) {
            return res.status(404).send({ message: "Plan not found." });
        }
        res.status(200).send(plans[0]);
    } catch (error) {
        console.error("Error fetching plan by ID:", error);
        res.status(500).send({ message: "Error fetching plan.", error: error.message });
    }
};

exports.updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, speed_mbps, data_limit_gb, price, duration_days, is_active,
            plan_code, include_gst, sac_code, show_on_customer_dashboard } = req.body;

    let updates = [];
    let queryParams = [];

    if (name !== undefined) { updates.push('name = ?'); queryParams.push(name); }
    if (speed_mbps !== undefined) { updates.push('speed_mbps = ?'); queryParams.push(speed_mbps); }
    if (data_limit_gb !== undefined) { updates.push('data_limit_gb = ?'); queryParams.push(data_limit_gb === '' ? null : data_limit_gb); }
    if (price !== undefined) { updates.push('price = ?'); queryParams.push(price); }
    if (duration_days !== undefined) { updates.push('duration_days = ?'); queryParams.push(duration_days); }
    if (is_active !== undefined) { updates.push('is_active = ?'); queryParams.push(is_active); }
    if (plan_code !== undefined) { updates.push('plan_code = ?'); queryParams.push(plan_code || null); }
    if (include_gst !== undefined) { updates.push('include_gst = ?'); queryParams.push(include_gst); }
    if (sac_code !== undefined) { updates.push('sac_code = ?'); queryParams.push(sac_code || null); }
    if (show_on_customer_dashboard !== undefined) { updates.push('show_on_customer_dashboard = ?'); queryParams.push(show_on_customer_dashboard); }

    if (updates.length === 0) {
        return res.status(400).send({ message: "No fields provided for update." });
    }

    try {
        const sql = `UPDATE plans SET ${updates.join(', ')} WHERE id = ?`;
        queryParams.push(id);

        const [result] = await pool.query(sql, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Plan not found." });
        }
        res.status(200).send({ message: "Plan updated successfully." });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "Plan with this name or code already exists." });
        }
        console.error("Error updating plan:", error);
        res.status(500).send({ message: "Error updating plan.", error: error.message });
    }
};

exports.deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        const [subscriptions] = await pool.query('SELECT COUNT(*) AS count FROM subscriptions WHERE plan_id = ? AND status = "active"', [id]);
        if (subscriptions[0].count > 0) {
            return res.status(409).send({ message: "Cannot delete plan: it is linked to active subscriptions. Deactivate it instead." });
        }

        const [result] = await pool.query('DELETE FROM plans WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Plan not found." });
        }
        res.status(200).send({ message: "Plan deleted successfully." });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).send({ message: "Error deleting plan.", error: error.message });
    }
};