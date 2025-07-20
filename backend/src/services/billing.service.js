const pool = require('../config/db.config');

const generateRenewalInvoices = async () => {
  console.log('Running daily check for renewal invoices...');
  const connection = await pool.getConnection(); // Get a connection from the pool for transaction

  try {
    // Find active subscriptions ending within the next 7 days that don't have an unpaid invoice yet
    const renewalQuery = `
      SELECT s.id as subscription_id, s.customer_id, s.plan_id, s.end_date, p.price as plan_price, p.duration_days
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
      AND s.end_date <= CURDATE() + INTERVAL 7 DAY
      AND NOT EXISTS (
        SELECT 1 FROM invoices i 
        WHERE i.subscription_id = s.id AND i.status = 'unpaid'
      )`;

    const [subscriptionsToRenew] = await connection.query(renewalQuery);

    if (subscriptionsToRenew.length === 0) {
      console.log('No subscriptions due for renewal today.');
      return;
    }

    console.log(`Found ${subscriptionsToRenew.length} subscriptions to renew.`);

    for (const sub of subscriptionsToRenew) {
      await connection.beginTransaction(); // Start a transaction

      // 1. Create the new invoice
      const newDueDate = sub.end_date;
      const invoiceSql = 'INSERT INTO invoices (subscription_id, customer_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)';
      await connection.query(invoiceSql, [sub.subscription_id, sub.customer_id, sub.plan_price, newDueDate, 'unpaid']);

      // 2. Update the subscription's end_date for the next cycle
      const newEndDate = new Date(sub.end_date);
      newEndDate.setDate(newEndDate.getDate() + sub.duration_days);

      const updateSubSql = 'UPDATE subscriptions SET end_date = ? WHERE id = ?';
      await connection.query(updateSubSql, [newEndDate, sub.subscription_id]);

      await connection.commit(); // Commit the transaction
      console.log(`Successfully generated invoice for subscription ID: ${sub.subscription_id}`);
    }
  } catch (error) {
    await connection.rollback(); // Rollback on error
    console.error('Failed to generate renewal invoices:', error);
  } finally {
    connection.release(); // Always release the connection back to the pool
  }
};

module.exports = { generateRenewalInvoices };