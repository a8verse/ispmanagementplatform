// backend/src/controllers/subscription.controller.js
const pool = require('../config/db.config');

const calculateNextBillingDate = (startDate, durationDays) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationDays);
    return date.toISOString().split('T')[0];
};

exports.createSubscription = async (req, res) => {
    const { customer_id, plan_id, start_date, status, activated_by } = req.body;

    if (!customer_id || !plan_id || !start_date || !activated_by) {
        return res.status(400).send({ message: "Customer ID, Plan ID, Start Date, and Activated By user are required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [plans] = await connection.query('SELECT price, duration_days FROM plans WHERE id = ?', [plan_id]);
        if (plans.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Plan not found." });
        }
        const plan = plans[0];

        const parsedStartDate = new Date(start_date);
        const end_date = calculateNextBillingDate(parsedStartDate, plan.duration_days);
        const next_billing_date = calculateNextBillingDate(parsedStartDate, plan.duration_days);

        const insertSql = `
            INSERT INTO subscriptions (
                customer_id, plan_id, start_date, end_date, status, activated_by,
                price_at_subscription, billing_cycle_start_date, next_billing_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(insertSql, [
            customer_id,
            plan_id,
            start_date,
            end_date,
            status || 'active',
            activated_by,
            plan.price,
            start_date,
            next_billing_date
        ]);

        await connection.commit();
        res.status(201).send({ message: "Subscription created successfully!", subscriptionId: result.insertId });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating subscription:", error);
        res.status(500).send({ message: "Error creating subscription.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.getCustomerSubscriptions = async (req, res) => {
    const { customerId } = req.params;
    try {
        const sql = `
            SELECT
                s.id, s.customer_id, s.plan_id, s.start_date, s.end_date, s.status,
                s.created_at, s.activated_by, s.price_at_subscription,
                s.billing_cycle_start_date, s.next_billing_date,
                p.name AS plan_name, p.speed_mbps, p.data_limit_gb, p.price AS current_plan_price, p.duration_days,
                u.username AS activated_by_username
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            JOIN users u ON s.activated_by = u.id
            WHERE s.customer_id = ?
            ORDER BY s.start_date DESC
        `;
        const [subscriptions] = await pool.query(sql, [customerId]);
        res.status(200).send(subscriptions);
    } catch (error) {
        console.error("Error fetching customer subscriptions:", error);
        res.status(500).send({ message: "Error fetching customer subscriptions.", error: error.message });
    }
};

exports.getSubscriptionById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT
                s.id, s.customer_id, s.plan_id, s.start_date, s.end_date, s.status,
                s.created_at, s.activated_by, s.price_at_subscription,
                s.billing_cycle_start_date, s.next_billing_date,
                p.name AS plan_name, p.speed_mbps, p.data_limit_gb, p.price AS current_plan_price, p.duration_days,
                u.username AS activated_by_username
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            JOIN users u ON s.activated_by = u.id
            WHERE s.id = ?
        `;
        const [subscriptions] = await pool.query(sql, [id]);
        if (subscriptions.length === 0) {
            return res.status(404).send({ message: "Subscription not found." });
        }
        res.status(200).send(subscriptions[0]);
    } catch (error) {
        console.error("Error fetching subscription by ID:", error);
        res.status(500).send({ message: "Error fetching subscription.", error: error.message });
    }
};

exports.updateSubscription = async (req, res) => {
    const { id } = req.params;
    const { plan_id, start_date, end_date, status, billing_cycle_start_date, next_billing_date } = req.body;

    let updates = [];
    let queryParams = [];

    if (plan_id !== undefined) { updates.push('plan_id = ?'); queryParams.push(plan_id); }
    if (start_date !== undefined) { updates.push('start_date = ?'); queryParams.push(start_date); }
    if (end_date !== undefined) { updates.push('end_date = ?'); queryParams.push(end_date); }
    if (status !== undefined) { updates.push('status = ?'); queryParams.push(status); }
    if (billing_cycle_start_date !== undefined) { updates.push('billing_cycle_start_date = ?'); queryParams.push(billing_cycle_start_date); }
    if (next_billing_date !== undefined) { updates.push('next_billing_date = ?'); queryParams.push(next_billing_date); }

    if (updates.length === 0) {
        return res.status(400).send({ message: "No fields provided for update." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let newPriceAtSubscription = null;
        if (plan_id !== undefined) {
            const [plans] = await connection.query('SELECT price FROM plans WHERE id = ?', [plan_id]);
            if (plans.length === 0) {
                await connection.rollback();
                return res.status(404).send({ message: "New plan not found." });
            }
            newPriceAtSubscription = plans[0].price;
            updates.push('price_at_subscription = ?');
            queryParams.push(newPriceAtSubscription);
        }

        const sql = `UPDATE subscriptions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        queryParams.push(id);

        const [result] = await connection.query(sql, queryParams);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Subscription not found." });
        }

        await connection.commit();
        res.status(200).send({ message: "Subscription updated successfully." });

    } catch (error) {
        await connection.rollback();
        console.error("Error updating subscription:", error);
        res.status(500).send({ message: "Error updating subscription.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteSubscription = async (req, res) => {
    const { id } = req.params;
    try {
        const [invoices] = await pool.query('SELECT COUNT(*) AS count FROM invoices WHERE subscription_id = ?', [id]);
        if (invoices[0].count > 0) {
            return res.status(409).send({ message: "Cannot delete subscription: it has associated invoices. Please cancel or deactivate it instead." });
        }

        const [result] = await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Subscription not found." });
        }
        res.status(200).send({ message: "Subscription deleted successfully." });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        res.status(500).send({ message: "Error deleting subscription.", error: error.message });
    }
};