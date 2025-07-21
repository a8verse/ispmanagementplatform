// frontend/src/pages/CustomerDetailsPage.js
import React, { useState, useEffect } => 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import '../App.css';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [isEditingSubscription, setIsEditingSubscription] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState({
        id: null,
        customer_id: id,
        plan_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        status: 'active',
        activated_by: '',
        price_at_subscription: '',
        billing_cycle_start_date: format(new Date(), 'yyyy-MM-dd'),
        next_billing_date: '',
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchCustomerDetails();
        fetchCustomerSubscriptions();
        fetchPlans();
    }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await api.get(`/customers/${id}`);
            setCustomer(response.data);
        } catch (err) {
            console.error('Error fetching customer details:', err);
            setError(err.response?.data?.message || 'Failed to load customer details.');
            navigate('/customers');
        }
    };

    const fetchCustomerSubscriptions = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get(`/subscriptions/customer/${id}`);
            setSubscriptions(response.data);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            setError(err.response?.data?.message || 'Failed to load subscriptions.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');
            setPlans(response.data.filter(plan => plan.is_active).map(plan => ({
                ...plan,
                speed_mbps: Number(plan.speed_mbps),
                price: Number(plan.price),
                data_limit_gb: plan.data_limit_gb === null ? null : Number(plan.data_limit_gb),
            })));
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const getLoggedInUserId = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user.id : null;
    };

    const handleAddSubscriptionClick = () => {
        setIsEditingSubscription(false);
        setCurrentSubscription({
            id: null,
            customer_id: id,
            plan_id: '',
            start_date: format(new Date(), 'yyyy-MM-dd'),
            end_date: '',
            status: 'active',
            activated_by: getLoggedInUserId(),
            price_at_subscription: '',
            billing_cycle_start_date: format(new Date(), 'yyyy-MM-dd'),
            next_billing_date: '',
        });
        setSuccessMessage('');
        setError('');
        setShowSubscriptionModal(true);
    };

    const handleEditSubscriptionClick = (sub) => {
        setIsEditingSubscription(true);
        setCurrentSubscription({
            ...sub,
            start_date: sub.start_date ? format(new Date(sub.start_date), 'yyyy-MM-dd') : '',
            end_date: sub.end_date ? format(new Date(sub.end_date), 'yyyy-MM-dd') : '',
            billing_cycle_start_date: sub.billing_cycle_start_date ? format(new Date(sub.billing_cycle_start_date), 'yyyy-MM-dd') : '',
            next_billing_date: sub.next_billing_date ? format(new Date(sub.next_billing_date), 'yyyy-MM-dd') : '',
            plan_id: Number(sub.plan_id),
            price_at_subscription: Number(sub.price_at_subscription),
        });
        setSuccessMessage('');
        setError('');
        setShowSubscriptionModal(true);
    };

    const handleDeleteSubscriptionClick = async (subId) => {
        if (window.confirm('Are you sure you want to DELETE this subscription? This is irreversible and will not update invoices. Consider setting status to "cancelled" or "inactive" instead.')) {
            setIsLoading(true);
            setError('');
            setSuccessMessage('');
            try {
                await api.delete(`/subscriptions/${subId}`);
                setSuccessMessage('Subscription deleted successfully!');
                fetchCustomerSubscriptions();
            } catch (err) {
                console.error('Error deleting subscription:', err);
                setError(err.response?.data?.message || 'Failed to delete subscription.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubscriptionFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        if (name === 'plan_id') {
            const selectedPlan = plans.find(p => p.id === Number(newValue));
            if (selectedPlan) {
                setCurrentSubscription(prev => ({
                    ...prev,
                    plan_id: Number(newValue),
                    price_at_subscription: selectedPlan.price,
                }));
            } else {
                setCurrentSubscription(prev => ({
                    ...prev,
                    plan_id: Number(newValue),
                    price_at_subscription: '',
                }));
            }
        } else {
            setCurrentSubscription(prev => ({ ...prev, [name]: newValue }));
        }
    };

    const handleSaveSubscription = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        setSuccessMessage('');

        const payload = {
            ...currentSubscription,
            customer_id: Number(currentSubscription.customer_id),
            plan_id: Number(currentSubscription.plan_id),
            activated_by: Number(currentSubscription.activated_by),
            price_at_subscription: Number(currentSubscription.price_at_subscription),
        };

        if (!payload.customer_id || !payload.plan_id || !payload.start_date || !payload.activated_by) {
            setError('Missing required fields for subscription.');
            setFormLoading(false);
            return;
        }
        if (isNaN(payload.price_at_subscription)) {
            setError('Invalid price for subscription. Select a plan.');
            setFormLoading(false);
            return;
        }

        try {
            if (isEditingSubscription) {
                await api.put(`/subscriptions/${payload.id}`, payload);
                setSuccessMessage('Subscription updated successfully!');
            } else {
                await api.post('/subscriptions', payload);
                setSuccessMessage('Subscription created successfully!');
            }
            setShowSubscriptionModal(false);
            fetchCustomerSubscriptions();
        } catch (err) {
            console.error('Error saving subscription:', err);
            setError(err.response?.data?.message || 'Failed to save subscription.');
        } finally {
            setFormLoading(false);
        }
    };

    if (!customer && isLoading) {
        return (
            <div className="page-container customer-details-page">
                <p>Loading customer details...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="page-container customer-details-page">
                <p>Customer not found.</p>
                <Link to="/customers" className="primary-button">Back to Customers</Link>
            </div>
        );
    }

    return (
        <div className="page-container customer-details-page">
            <div className="customer-info-section">
                <h2>Customer Details: {customer.full_name}</h2>
                <p><strong>ID:</strong> {customer.id}</p>
                <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {customer.phone_number}</p>
                <p><strong>Address:</strong> {customer.address}</p>
                <Link to="/customers" className="secondary-button">Back to All Customers</Link>
            </div>

            <div className="subscriptions-section page-container" style={{marginTop: '20px'}}>
                <h3>Subscriptions</h3>
                {error && <div className="alert error">{error}</div>}
                {successMessage && <div className="alert success">{successMessage}</div>}

                <button className="primary-button" onClick={handleAddSubscriptionClick}>Add New Subscription</button>

                {isLoading ? (
                    <p>Loading subscriptions...</p>
                ) : subscriptions.length === 0 ? (
                    <p>No subscriptions found for this customer. Click "Add New Subscription" to create one.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sub ID</th>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Price Subscribed</th>
                                    <th>Activated By</th>
                                    <th>Next Bill</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map(sub => (
                                    <tr key={sub.id}>
                                        <td>{sub.id}</td>
                                        <td>{sub.plan_name} ({Number(sub.speed_mbps)} Mbps - {sub.data_limit_gb === null || sub.data_limit_gb === 0 ? 'Unlimited' : `${Number(sub.data_limit_gb)} GB`})</td>
                                        <td>{sub.start_date ? format(new Date(sub.start_date), 'dd/MM/yyyy') : 'N/A'}</td>
                                        <td>{sub.end_date ? format(new Date(sub.end_date), 'dd/MM/yyyy') : 'Ongoing'}</td>
                                        <td className={`status-${sub.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {sub.status.replace(/_/g, ' ')}
                                        </td>
                                        <td>₹{Number(sub.price_at_subscription).toFixed(2)}</td>
                                        <td>{sub.activated_by_username || 'N/A'}</td>
                                        <td>{sub.next_billing_date ? format(new Date(sub.next_billing_date), 'dd/MM/yyyy') : 'N/A'}</td>
                                        <td>
                                            <button className="edit-button" onClick={() => handleEditSubscriptionClick(sub)}>Edit</button>
                                            <button className="danger-button" onClick={() => handleDeleteSubscriptionClick(sub.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal show={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} title={isEditingSubscription ? "Edit Subscription" : "Add New Subscription"}>
                <form onSubmit={handleSaveSubscription}>
                    <div className="form-group">
                        <label htmlFor="subscriptionPlanId">Plan:</label>
                        <select
                            id="subscriptionPlanId"
                            name="plan_id"
                            value={currentSubscription.plan_id}
                            onChange={handleSubscriptionFormChange}
                            required
                        >
                            <option value="">-- Select a Plan --</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} ({Number(plan.speed_mbps)} Mbps - ₹{Number(plan.price).toFixed(2)})
                                </option>
                            ))}
                        </select>
                    </div>
                    {currentSubscription.plan_id && (
                        <div className="form-group">
                            <label>Price at Subscription:</label>
                            <input
                                type="text"
                                value={`₹${Number(currentSubscription.price_at_subscription).toFixed(2)}`}
                                readOnly
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="subscriptionStartDate">Start Date (DD/MM/YYYY):</label>
                        <input
                            type="date"
                            id="subscriptionStartDate"
                            name="start_date"
                            value={currentSubscription.start_date}
                            onChange={handleSubscriptionFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="subscriptionEndDate">End Date (DD/MM/YYYY, Optional):</label>
                        <input
                            type="date"
                            id="subscriptionEndDate"
                            name="end_date"
                            value={currentSubscription.end_date}
                            onChange={handleSubscriptionFormChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="billingCycleStartDate">Billing Cycle Start Date (DD/MM/YYYY):</label>
                        <input
                            type="date"
                            id="billingCycleStartDate"
                            name="billing_cycle_start_date"
                            value={currentSubscription.billing_cycle_start_date}
                            onChange={handleSubscriptionFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nextBillingDate">Next Billing Date (DD/MM/YYYY):</label>
                        <input
                            type="date"
                            id="nextBillingDate"
                            name="next_billing_date"
                            value={currentSubscription.next_billing_date}
                            onChange={handleSubscriptionFormChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="subscriptionStatus">Status:</label>
                        <select
                            id="subscriptionStatus"
                            name="status"
                            value={currentSubscription.status}
                            onChange={handleSubscriptionFormChange}
                            required
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="activatedBy">Activated By (User ID):</label>
                        <input
                            type="number"
                            id="activatedBy"
                            name="activated_by"
                            value={currentSubscription.activated_by}
                            onChange={handleSubscriptionFormChange}
                            required
                            readOnly
                        />
                    </div>
                    <button type="submit" className="primary-button" disabled={formLoading}>
                        {formLoading ? (isEditingSubscription ? 'Saving...' : 'Adding...') : (isEditingSubscription ? 'Update Subscription' : 'Add Subscription')}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default CustomerDetailsPage;