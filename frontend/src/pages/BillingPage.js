// frontend/src/pages/BillingPage.js
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import '../App.css'; // Global CSS is loaded

const BillingPage = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // State for Manual Payment Modal
    const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
    const [currentInvoiceForPayment, setCurrentInvoiceForPayment] = useState(null);
    const [manualPaymentData, setManualPaymentData] = useState({
        amount: '',
        paymentMethodId: '',
        referenceNumber: '',
        transactionDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
    });
    const [offlinePaymentMethods, setOfflinePaymentMethods] = useState([]);
    const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
    const [manualPaymentError, setManualPaymentError] = useState('');

    useEffect(() => {
        fetchCustomers();
        fetchOfflinePaymentMethods();
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            fetchCustomerInvoices(selectedCustomerId);
        } else {
            setInvoices([]);
        }
    }, [selectedCustomerId]);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers.');
        }
    };

    const fetchOfflinePaymentMethods = async () => {
        try {
            const response = await api.get('/payment-methods');
            setOfflinePaymentMethods(response.data.filter(method => method.type === 'offline' && method.is_active));
        } catch (err) {
            console.error('Error fetching offline payment methods:', err);
        }
    };

    const fetchCustomerInvoices = async (customerId) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/billing/customer/${customerId}`);
            setInvoices(response.data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError(err.response?.data?.message || 'Failed to load invoices for selected customer.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoices = async () => {
        if (window.confirm('Are you sure you want to trigger manual invoice generation for all active subscriptions? This action is typically automated.')) {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            try {
                await api.post('/billing/generate-invoices');
                setSuccessMessage('Invoices generation initiated successfully!');
                if (selectedCustomerId) {
                    fetchCustomerInvoices(selectedCustomerId);
                }
            } catch (err) {
                console.error('Error generating invoices:', err);
                setError(err.response?.data?.message || 'Failed to generate invoices.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePayment = async (invoice) => {
        const amount = Number(invoice.amount) * 100; // Ensure amount is a number and convert to paisa

        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: amount,
            currency: 'INR',
            name: 'Net Controller ISP',
            description: `Payment for Invoice #${invoice.invoice_number}`,
            order_id: null,
            handler: async (response) => {
                try {
                    await api.post('/payments/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        invoice_id: invoice.id
                    });
                    setSuccessMessage('Payment successful and verified!');
                    fetchCustomerInvoices(selectedCustomerId);
                } catch (err) {
                    console.error('Payment verification failed:', err);
                    setError(err.response?.data?.message || 'Payment verification failed.');
                }
            },
            prefill: {
                name: customers.find(c => c.id === selectedCustomerId)?.full_name || 'Customer',
                email: customers.find(c => c.id === selectedCustomerId)?.email || 'customer@example.com',
                contact: customers.find(c => c.id === selectedCustomerId)?.contact_number || '9999999999',
            },
            notes: {
                invoice_id: invoice.id,
            },
            theme: {
                color: '#3399CC'
            }
        };

        try {
            const orderResponse = await api.post('/payments/create-order', { invoiceId: invoice.id });
            options.order_id = orderResponse.data.orderId;

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            console.error('Error initiating Razorpay payment:', err);
            setError(err.response?.data?.message || 'Failed to initiate online payment.');
        }
    };

    const handleRecordManualPaymentClick = (invoice) => {
        setCurrentInvoiceForPayment(invoice);
        setManualPaymentData({
            amount: invoice.amount,
            paymentMethodId: '',
            referenceNumber: '',
            transactionDate: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
        });
        setManualPaymentError('');
        setShowManualPaymentModal(true);
    };

    const handleManualPaymentChange = (e) => {
        const { name, value } = e.target;
        setManualPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handleManualPaymentSubmit = async (e) => {
        e.preventDefault();
        setManualPaymentLoading(true);
        setManualPaymentError('');
        setSuccessMessage('');

        if (!manualPaymentData.paymentMethodId) {
            setManualPaymentError('Please select a payment method.');
            setManualPaymentLoading(false);
            return;
        }

        try {
            const payload = {
                ...manualPaymentData,
                invoiceId: currentInvoiceForPayment.id,
                amount: parseFloat(manualPaymentData.amount),
            };
            const response = await api.post('/payments/record-manual', payload);
            setSuccessMessage(response.data.message || 'Manual payment recorded successfully!');
            setShowManualPaymentModal(false);
            fetchCustomerInvoices(selectedCustomerId);
        } catch (err) {
            console.error('Error recording manual payment:', err);
            setManualPaymentError(err.response?.data?.message || 'Failed to record manual payment.');
        } finally {
            setManualPaymentLoading(false);
        }
    };


    return (
        <div className="page-container billing-page">
            <h2>Billing & Invoices</h2>
            {error && <div className="alert error">{error}</div>}
            {successMessage && <div className="alert success">{successMessage}</div>}

            <div className="controls">
                <div className="form-group">
                    <label htmlFor="customerSelect">Select Customer:</label>
                    <select
                        id="customerSelect"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">-- Select a Customer --</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.full_name} ({customer.contact_number})
                            </option>
                        ))}
                    </select>
                </div>
                <button onClick={handleGenerateInvoices} disabled={loading} className="secondary-button">
                    {loading ? 'Generating...' : 'Generate All Invoices (Admin)'}
                </button>
            </div>

            {selectedCustomerId && (
                <div className="invoices-section">
                    <h3>Invoices for {customers.find(c => c.id === selectedCustomerId)?.full_name}</h3>
                    {loading ? (
                        <p>Loading invoices...</p>
                    ) : invoices.length === 0 ? (
                        <p>No invoices found for this customer.</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(invoice => (
                                        <tr key={invoice.id}>
                                            <td>{invoice.invoice_number || invoice.id}</td> {/* Use invoice_number if available, fallback to id */}
                                            <td>{invoice.issue_date ? format(new Date(invoice.issue_date), 'dd/MM/yyyy') : 'N/A'}</td> {/* Format as DD/MM/YYYY */}
                                            <td>{invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : 'N/A'}</td> {/* Format as DD/MM/YYYY */}
                                            <td>₹{Number(invoice.amount).toFixed(2)}</td>
                                            <td className={`status-${invoice.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                                {invoice.status.replace(/_/g, ' ')}
                                            </td>
                                            <td>
                                                {invoice.status === 'unpaid' && (
                                                    <>
                                                        <button className="primary-button" onClick={() => handlePayment(invoice)}>
                                                            Pay Online
                                                        </button>
                                                        <button className="secondary-button" onClick={() => handleRecordManualPaymentClick(invoice)}>
                                                            Record Manual
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Modal show={showManualPaymentModal} onClose={() => setShowManualPaymentModal(false)} title="Record Manual Payment">
                {currentInvoiceForPayment && (
                    <div className="manual-payment-details">
                        <p>Invoice #: <strong>{currentInvoiceForPayment.invoice_number || currentInvoiceForPayment.id}</strong></p>
                        <p>Amount Due: <strong>₹{Number(currentInvoiceForPayment.amount).toFixed(2)}</strong></p>
                    </div>
                )}
                {manualPaymentError && <div className="alert error">{manualPaymentError}</div>}
                <form onSubmit={handleManualPaymentSubmit}>
                    <div className="form-group">
                        <label htmlFor="manualAmount">Amount Received:</label>
                        <input
                            type="number"
                            id="manualAmount"
                            name="amount"
                            value={manualPaymentData.amount}
                            onChange={handleManualPaymentChange}
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentMethodId">Payment Method:</label>
                        <select
                            id="paymentMethodId"
                            name="paymentMethodId"
                            value={manualPaymentData.paymentMethodId}
                            onChange={handleManualPaymentChange}
                            required
                        >
                            <option value="">-- Select Method --</option>
                            {offlinePaymentMethods.map(method => (
                                <option key={method.id} value={method.id}>
                                    {method.name} {method.is_approval_required ? '(Approval Req.)' : '(Auto Approve)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="referenceNumber">Reference Number (UPI ID/Cheque No.):</label>
                        <input
                            type="text"
                            id="referenceNumber"
                            name="referenceNumber"
                            value={manualPaymentData.referenceNumber}
                            onChange={handleManualPaymentChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="transactionDate">Transaction Date (DD/MM/YYYY):</label>
                        <input
                            type="date" // Use type="date" for native date picker
                            id="transactionDate"
                            name="transactionDate"
                            value={manualPaymentData.transactionDate}
                            onChange={handleManualPaymentChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="notes">Notes (Optional):</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={manualPaymentData.notes}
                            onChange={handleManualPaymentChange}
                            rows="3"
                        ></textarea>
                    </div>
                    <button type="submit" className="primary-button" disabled={manualPaymentLoading}>
                        {manualPaymentLoading ? 'Recording...' : 'Record Payment'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default BillingPage;