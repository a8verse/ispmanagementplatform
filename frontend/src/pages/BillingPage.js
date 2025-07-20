import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const BillingPage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers.');
    }
  };

  const fetchInvoices = async () => {
    if (!selectedCustomerId) {
      setInvoices([]);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const response = await apiClient.get(`/billing/customer/${selectedCustomerId}`);
      setInvoices(response.data);
    } catch (err) {
      setError('Failed to fetch invoices for this customer.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedCustomerId]);

  // --- NEW: PAYMENT HANDLER FUNCTION ---
  const handlePayment = async (invoice) => {
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      // 1. Create a Razorpay Order from our backend
      const orderResponse = await apiClient.post('/payments/create-order', {
        invoiceId: invoice.id,
      });
      const { orderId, amount } = orderResponse.data;

      // 2. Configure Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Get Key ID from frontend environment variables
        amount: amount,
        currency: 'INR',
        name: 'Net Controller ISP',
        description: `Payment for Invoice #${invoice.id}`,
        order_id: orderId,
        handler: async (response) => {
          // 3. This function is called after payment is successful
          try {
            await apiClient.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoice_id: invoice.id,
            });
            alert('Payment Successful!');
            fetchInvoices(); // Refresh the invoice list
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user ? user.username : 'Customer',
          email: user ? user.email : 'customer@example.com',
        },
        theme: {
          color: '#3399cc',
        },
      };

      // 4. Open the Razorpay checkout modal
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Error creating payment order.');
    }
  };

  return (
    <div>
      <h2>Billing & Invoices</h2>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="customer-select">Select a Customer:</label>
        <select
          id="customer-select"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">-- Please choose a customer --</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name} (ID: {customer.id})
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading invoices...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {selectedCustomerId && !isLoading && (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Plan Name</th>
              <th>Amount (INR)</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Pay</th> {/* <-- NEW HEADER */}
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.plan_name}</td>
                  <td>₹{invoice.amount}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{invoice.status}</td>
                  <td>
                    {/* --- NEW: CONDITIONAL PAY BUTTON --- */}
                    {invoice.status === 'unpaid' && (
                      <button onClick={() => handlePayment(invoice)}>Pay Now</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No invoices found for this customer.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BillingPage;