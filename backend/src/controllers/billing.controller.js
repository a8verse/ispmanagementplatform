// backend/src/controllers/billing.controller.js
const pool = require('../config/db.config');
const { generateRenewalInvoices } = require('../services/billing.service');

exports.triggerInvoiceGeneration = async (req, res) => {
  try {
    await generateRenewalInvoices();
    res.status(200).send({ message: "Invoice generation process completed successfully." });
  } catch (error) {
    console.error("Error triggering invoice generation:", error); // Added logging
    res.status(500).send({ message: "An error occurred during invoice generation.", error: error.message });
  }
};

exports.getInvoicesByCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const sql = `
        SELECT
            i.id, i.invoice_number, i.amount, i.due_date, i.status, i.issue_date,
            p.name as plan_name, p.speed_mbps, p.data_limit_gb
        FROM invoices i
        JOIN subscriptions s ON i.subscription_id = s.id
        JOIN plans p ON s.plan_id = p.id
        WHERE i.customer_id = ?
        ORDER BY i.due_date DESC
    `;
    const [invoices] = await pool.query(sql, [customerId]);
    res.status(200).send(invoices);
  } catch (error) {
    console.error("Error fetching invoices by customer:", error); // Added logging
    res.status(500).send({ message: "Error fetching invoices.", error: error.message });
  }
};