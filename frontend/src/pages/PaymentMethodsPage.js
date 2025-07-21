// frontend/src/pages/PaymentMethodsPage.js
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import '../App.css'; // Global CSS is loaded

const PaymentMethodsPage = () => {
    const [methods, setMethods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMethod, setCurrentMethod] = useState({ id: null, name: '', is_active: true, is_approval_required: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('/payment-methods');
            setMethods(response.data);
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setError('Failed to load payment methods. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setIsEditing(false);
        setCurrentMethod({ id: null, name: '', is_active: true, is_approval_required: true });
        setShowModal(true);
        setSuccessMessage('');
        setError('');
    };

    const handleEditClick = (method) => {
        setIsEditing(true);
        setCurrentMethod({ ...method });
        setShowModal(true);
        setSuccessMessage('');
        setError('');
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                await api.delete(`/payment-methods/${id}`);
                setSuccessMessage('Payment method deleted successfully!');
                fetchPaymentMethods();
            } catch (err) {
                console.error('Error deleting payment method:', err);
                setError(err.response?.data?.message || 'Failed to delete payment method.');
            }
        }
    };

    const handleSaveMethod = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            if (isEditing) {
                await api.put(`/payment-methods/${currentMethod.id}`, currentMethod);
                setSuccessMessage('Payment method updated successfully!');
            } else {
                await api.post('/payment-methods', currentMethod);
                setSuccessMessage('Payment method added successfully!');
            }
            setShowModal(false);
            fetchPaymentMethods();
        } catch (err) {
            console.error('Error saving payment method:', err);
            setError(err.response?.data?.message || 'Failed to save payment method.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container payment-methods-page">
            <h2>Payment Methods Management</h2>
            {error && <div className="alert error">{error}</div>}
            {successMessage && <div className="alert success">{successMessage}</div>}

            <button className="primary-button" onClick={handleAddClick}>Add New Method</button>

            {loading ? (
                <p>Loading payment methods...</p>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Active</th>
                                <th>Approval Required</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {methods.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No payment methods found.</td>
                                </tr>
                            ) : (
                                methods.map(method => (
                                    <tr key={method.id}>
                                        <td>{method.name}</td>
                                        <td>{method.type}</td>
                                        <td>{method.is_active ? 'Yes' : 'No'}</td>
                                        <td>{method.is_approval_required ? 'Yes' : 'No'}</td>
                                        <td>
                                            <button className="edit-button" onClick={() => handleEditClick(method)}>Edit</button>
                                            <button className="danger-button" onClick={() => handleDeleteClick(method.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit Payment Method" : "Add New Payment Method"}>
                <form onSubmit={handleSaveMethod}>
                    <div className="form-group">
                        <label htmlFor="name">Method Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={currentMethod.name}
                            onChange={handleFormChange}
                            required
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={currentMethod.is_active}
                            onChange={handleFormChange}
                        />
                        <label htmlFor="is_active">Is Active</label>
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="is_approval_required"
                            name="is_approval_required"
                            checked={currentMethod.is_approval_required}
                            onChange={handleFormChange}
                        />
                        <label htmlFor="is_approval_required">Requires Approval</label>
                    </div>
                    <button type="submit" className="primary-button" disabled={loading}>{isEditing ? "Update Method" : "Add Method"}</button>
                </form>
            </Modal>
        </div>
    );
};

export default PaymentMethodsPage;