// frontend/src/pages/ManualPaymentsApprovalPage.js
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { format } from 'date-fns';
import '../App.css'; // Global CSS is loaded

const ManualPaymentsApprovalPage = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('/payments/pending-manual');
            setPendingPayments(response.data);
        } catch (err) {
            console.error('Error fetching pending payments:', err);
            setError(err.response?.data?.message || 'Failed to load pending payments.');
        } finally {
            setActionLoading(null);
            setLoading(false);
        }
    };

    const handleApprove = async (transactionId) => {
        if (window.confirm('Are you sure you want to approve this payment?')) {
            setActionLoading(transactionId);
            setError('');
            setSuccessMessage('');
            try {
                await api.post(`/payments/${transactionId}/approve-manual`);
                setSuccessMessage('Payment approved successfully!');
                fetchPendingPayments();
            } catch (err) {
                console.error('Error approving payment:', err);
                setError(err.response?.data?.message || 'Failed to approve payment.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    const handleReject = async (transactionId) => {
        const rejectionReason = prompt('Are you sure you want to reject this payment? Please provide a reason:');
        if (rejectionReason !== null) {
            setActionLoading(transactionId);
            setError('');
            setSuccessMessage('');
            try {
                await api.post(`/payments/${transactionId}/reject-manual`, { notes: rejectionReason });
                setSuccessMessage('Payment rejected successfully!');
                fetchPendingPayments();
            } catch (err) {
                console.error('Error rejecting payment:', err);
                setError(err.response?.data?.message || 'Failed to reject payment.');
            } finally {
                setActionLoading(null);
            }
        }
    };

    return (
        <div className="page-container manual-payments-approval-page">
            <h2>Manual Payments Awaiting Approval</h2>
            {error && <div className="alert error">{error}</div>}
            {successMessage && <div className="alert success">{successMessage}</div>}

            {loading ? (
                <p>Loading pending payments...</p>
            ) : pendingPayments.length === 0 ? (
                <p>No manual payments currently awaiting approval.</p>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Trans. ID</th>
                                <th>Inv. #</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Ref. No.</th>
                                <th>Trans. Date</th>
                                <th>Recorded By</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayments.map(payment => (
                                <tr key={payment.transaction_id}>
                                    <td>{payment.transaction_id}</td>
                                    <td>{payment.invoice_number || 'N/A'}</td> {/* Use invoice_number */}
                                    <td>{payment.customer_name}</td>
                                    <td>₹{Number(payment.amount).toFixed(2)}</td>
                                    <td>{payment.payment_method_name} {payment.is_approval_required ? '(Req.)' : '(Auto)'}</td>
                                    <td>{payment.reference_number}</td>
                                    <td>{payment.transaction_date ? format(new Date(payment.transaction_date), 'dd/MM/yyyy') : 'N/A'}</td> {/* Format as DD/MM/YYYY */}
                                    <td>{payment.recorded_by_username}</td>
                                    <td>{payment.notes || 'N/A'}</td>
                                    <td>
                                        <button
                                            className="primary-button"
                                            onClick={() => handleApprove(payment.transaction_id)}
                                            disabled={actionLoading === payment.transaction_id}
                                        >
                                            {actionLoading === payment.transaction_id ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                            className="danger-button"
                                            onClick={() => handleReject(payment.transaction_id)}
                                            disabled={actionLoading === payment.transaction_id}
                                        >
                                            {actionLoading === payment.transaction_id ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManualPaymentsApprovalPage;