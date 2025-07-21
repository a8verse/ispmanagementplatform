// backend/src/controllers/payment.controller.js
const razorpay = require('../config/razorpay.config');
const pool = require('../config/db.config');
const crypto = require('crypto');

exports.createOrder = async (req, res) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res.status(400).send({ message: 'Invoice ID is required.' });
  }
  try {
    const [invoices] = await pool.query('SELECT amount FROM invoices WHERE id = ? AND status = "unpaid"', [invoiceId]);
    if (invoices.length === 0) {
      return res.status(404).send({ message: 'Unpaid invoice not found.' });
    }
    const invoice = invoices[0];
    const amountInPaisa = invoice.amount * 100;

    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `receipt_invoice_${invoiceId}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).send({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send({ message: 'Error creating payment order.', error });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).send({ message: 'Transaction not legit!' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const invoiceUpdateSql = 'UPDATE invoices SET status = "paid", paid_at = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.query(invoiceUpdateSql, [invoice_id]);

    const transactionSql = 'INSERT INTO transactions (invoice_id, amount, payment_method, transaction_id_gateway, status) VALUES (?, (SELECT amount FROM invoices WHERE id = ?), ?, ?, ?)';
    await connection.query(transactionSql, [invoice_id, invoice_id, 'Razorpay', razorpay_payment_id, 'successful']);

    await connection.commit();
    res.status(200).send({ message: 'Payment verified successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error("Error verifying payment and updating database:", error);
    res.status(500).send({ message: 'Error updating payment status.' });
  } finally {
    if (connection) connection.release();
  }
};

exports.recordManualPayment = async (req, res) => {
    const { invoiceId, amount, paymentMethodId, referenceNumber, transactionDate, notes } = req.body;
    const recordedBy = req.user.id;

    if (!invoiceId || !amount || !paymentMethodId || !referenceNumber || !transactionDate) {
        return res.status(400).send({ message: "Required fields: invoiceId, amount, paymentMethodId, referenceNumber, transactionDate." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [invoices] = await connection.query('SELECT id, amount FROM invoices WHERE id = ?', [invoiceId]);
        if (invoices.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Invoice not found." });
        }
        const invoice = invoices[0];
        if (invoice.amount <= 0) {
             await connection.rollback();
             return res.status(400).send({ message: "Invoice has no amount due." });
        }
        if (amount > invoice.amount) {
            await connection.rollback();
            return res.status(400).send({ message: "Payment amount exceeds total invoice amount." });
        }

        const [methods] = await connection.query('SELECT is_approval_required FROM payment_methods WHERE id = ?', [paymentMethodId]);
        if (methods.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Payment method not found." });
        }
        const isApprovalRequired = methods[0].is_approval_required;
        const status = isApprovalRequired ? 'pending_approval' : 'approved';

        const insertTransactionSql = `
            INSERT INTO transactions
            (invoice_id, amount, status, recorded_by, reference_number, transaction_date, notes, payment_method_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [transactionResult] = await connection.query(insertTransactionSql,
            [invoiceId, amount, status, recordedBy, referenceNumber, transactionDate, notes, paymentMethodId]
        );
        const transactionId = transactionResult.insertId;

        if (status === 'approved') {
            await connection.query('UPDATE invoices SET status = "paid", paid_at = CURRENT_TIMESTAMP WHERE id = ?', [invoiceId]);
        }

        await connection.commit();
        res.status(201).send({ message: "Manual payment recorded successfully!", transactionId: transactionId, status: status });

    } catch (error) {
        await connection.rollback();
        console.error("Error recording manual payment:", error);
        res.status(500).send({ message: "Error recording manual payment.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.getPendingManualPayments = async (req, res) => {
    try {
        const sql = `
            SELECT
                t.id AS transaction_id,
                t.amount,
                t.status,
                t.reference_number,
                t.transaction_date,
                t.notes,
                i.id AS invoice_id,
                i.invoice_number,
                c.id AS customer_id,
                c.full_name AS customer_name,
                pm.name AS payment_method_name,
                pm.is_approval_required,
                recorder.username AS recorded_by_username,
                approver.username AS approved_by_username,
                t.created_at
            FROM transactions t
            JOIN invoices i ON t.invoice_id = i.id
            JOIN customers c ON i.customer_id = c.id
            JOIN payment_methods pm ON t.payment_method_id = pm.id
            JOIN users recorder ON t.recorded_by = recorder.id
            LEFT JOIN users approver ON t.approved_by = approver.id
            WHERE t.status = 'pending_approval'
            ORDER BY t.created_at DESC
        `;
        const [payments] = await pool.query(sql);
        res.status(200).send(payments);
    } catch (error) {
        console.error("Error fetching pending manual payments:", error);
        res.status(500).send({ message: "Error fetching pending manual payments.", error: error.message });
    }
};

exports.approveManualPayment = async (req, res) => {
    const { transactionId } = req.params;
    const { notes: approvalNotes } = req.body;
    const approvedBy = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [transactions] = await connection.query('SELECT invoice_id, amount, status, notes FROM transactions WHERE id = ?', [transactionId]);
        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Transaction not found." });
        }
        const transaction = transactions[0];
        if (transaction.status !== 'pending_approval') {
            await connection.rollback();
            return res.status(400).send({ message: "Transaction is not pending approval or already processed." });
        }

        const finalNotes = transaction.notes ? `${transaction.notes}\nApproval Note: ${approvalNotes || ''}` : `Approval Note: ${approvalNotes || ''}`;

        await connection.query(
            'UPDATE transactions SET status = ?, approved_by = ?, notes = ? WHERE id = ?',
            ['approved', approvedBy, finalNotes, transactionId]
        );

        const [invoices] = await connection.query('SELECT amount_due FROM invoices WHERE id = ?', [transaction.invoice_id]);
        if (invoices.length === 0) {
            await connection.rollback();
            return res.status(500).send({ message: "Associated invoice not found, transaction approved but invoice update failed." });
        }
        const invoice = invoices[0];
        const newAmountDue = invoice.amount_due - transaction.amount;
        const invoiceStatus = newAmountDue <= 0 ? 'paid' : 'partially_paid';
        await connection.query('UPDATE invoices SET status = ?, amount_due = ? WHERE id = ?', [invoiceStatus, newAmountDue, transaction.invoice_id]);

        await connection.commit();
        res.status(200).send({ message: "Manual payment approved successfully." });

    } catch (error) {
        await connection.rollback();
        console.error("Error approving manual payment:", error);
        res.status(500).send({ message: "Error approving manual payment.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.rejectManualPayment = async (req, res) => {
    const { transactionId } = req.params;
    const { notes: rejectionNotes } = req.body;
    const approvedBy = req.user.id;

    try {
        const [transactions] = await pool.query('SELECT status, notes FROM transactions WHERE id = ?', [transactionId]);
        if (transactions.length === 0) {
            return res.status(404).send({ message: "Transaction not found." });
        }
        const transaction = transactions[0];
        if (transaction.status !== 'pending_approval') {
            return res.status(400).send({ message: "Transaction is not pending approval or already processed." });
        }

        const finalNotes = transaction.notes ? `${transaction.notes}\nRejection Note: ${rejectionNotes || ''}` : `Rejection Note: ${rejectionNotes || ''}`;

        const [result] = await pool.query(
            'UPDATE transactions SET status = ?, approved_by = ?, notes = ? WHERE id = ?',
            ['rejected', approvedBy, finalNotes, transactionId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).send({ message: "Failed to reject manual payment." });
        }

        res.status(200).send({ message: "Manual payment rejected successfully." });

    } catch (error) {
        console.error("Error rejecting manual payment:", error);
        res.status(500).send({ message: "Error rejecting manual payment.", error: error.message });
    }
};