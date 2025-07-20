const razorpay = require('../config/razorpay.config');
const pool = require('../config/db.config');
const crypto = require('crypto');

// 1. CREATE ORDER: Called when the user clicks "Pay Now"
exports.createOrder = async (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).send({ message: 'Invoice ID is required.' });
  }

  try {
    // Fetch invoice details from your database
    const [invoices] = await pool.query('SELECT amount FROM invoices WHERE id = ? AND status = "unpaid"', [invoiceId]);

    if (invoices.length === 0) {
      return res.status(404).send({ message: 'Unpaid invoice not found.' });
    }

    const invoice = invoices[0];
    const amountInPaisa = invoice.amount * 100; // Razorpay requires amount in paisa

    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `receipt_invoice_${invoiceId}`, // A unique receipt ID
    };

    const order = await razorpay.orders.create(options);
    res.status(200).send({ orderId: order.id, amount: order.amount });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send({ message: 'Error creating payment order.', error });
  }
};

// 2. VERIFY PAYMENT: Called by Razorpay after the user completes payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).send({ message: 'Transaction not legit!' });
  }

  // --- If signature is legit, update the database ---
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update invoice status
    const invoiceUpdateSql = 'UPDATE invoices SET status = "paid", paid_at = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.query(invoiceUpdateSql, [invoice_id]);

    // Create a transaction log
    const transactionSql = 'INSERT INTO transactions (invoice_id, amount, payment_method, transaction_id_gateway, status) VALUES (?, (SELECT amount FROM invoices WHERE id = ?), ?, ?, ?)';
    await connection.query(transactionSql, [invoice_id, invoice_id, 'Razorpay', razorpay_payment_id, 'successful']);

    await connection.commit();

    // On success, you'd typically redirect the user to a success page
    res.status(200).send({ message: 'Payment verified successfully.' });

  } catch (error) {
    await connection.rollback();
    console.error("Error verifying payment and updating database:", error);
    res.status(500).send({ message: 'Error updating payment status.' });
  } finally {
    connection.release();
  }
};