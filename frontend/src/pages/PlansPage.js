// frontend/src/pages/PlansPage.js
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import '../App.css';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    id: null,
    name: '',
    speed_mbps: '',
    data_limit_gb: '',
    price: '',
    duration_days: '',
    is_active: true,
    plan_code: '',
    include_gst: true,
    sac_code: '',
    show_on_customer_dashboard: false,
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.get('/plans');
      setPlans(response.data.map(plan => ({
        ...plan,
        speed_mbps: Number(plan.speed_mbps),
        price: Number(plan.price),
        data_limit_gb: plan.data_limit_gb === null ? null : Number(plan.data_limit_gb),
      })));
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.response?.data?.message || 'Failed to load plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentPlan({
      id: null,
      name: '',
      speed_mbps: '',
      data_limit_gb: '',
      price: '',
      duration_days: '',
      is_active: true,
      plan_code: '',
      include_gst: true,
      sac_code: '',
      show_on_customer_dashboard: false,
    });
    setShowModal(true);
    setError('');
    setSuccessMessage('');
  };

  const handleEditClick = (plan) => {
    setIsEditing(true);
    setCurrentPlan({
      ...plan,
      data_limit_gb: plan.data_limit_gb === null ? '' : plan.data_limit_gb,
      plan_code: plan.plan_code || '',
      sac_code: plan.sac_code || '',
    });
    setShowModal(true);
    setError('');
    setSuccessMessage('');
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone, especially if it is linked to active subscriptions.')) {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      try {
        await api.delete(`/plans/${id}`);
        setSuccessMessage('Plan deleted successfully!');
        fetchPlans();
      } catch (err) {
        console.error('Error deleting plan:', err);
        setError(err.response?.data?.message || 'Failed to delete plan.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (['speed_mbps', 'data_limit_gb', 'price', 'duration_days'].includes(name)) {
        newValue = value === '' ? '' : Number(value);
    }

    setCurrentPlan(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      ...currentPlan,
      speed_mbps: Number(currentPlan.speed_mbps),
      price: Number(currentPlan.price),
      duration_days: Number(currentPlan.duration_days),
      data_limit_gb: currentPlan.data_limit_gb === '' ? null : Number(currentPlan.data_limit_gb),
      plan_code: currentPlan.plan_code || null,
      sac_code: currentPlan.sac_code || null,
    };

    try {
      if (isEditing) {
        await api.put(`/plans/${payload.id}`, payload);
        setSuccessMessage('Plan updated successfully!');
      } else {
        await api.post('/plans', payload);
        setSuccessMessage('Plan added successfully!');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setFormLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container plans-page">
        <h2>Plan Management</h2>
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="page-container plans-page">
      <h2>Plan Management</h2>
      {error && <div className="alert error">{error}</div>}
      {successMessage && <div className="alert success">{successMessage}</div>}

      <button className="primary-button" onClick={handleAddClick}>Add New Plan</button>

      {plans.length === 0 ? (
          <p>No plans found. Click "Add New Plan" to create one.</p>
      ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plan Name</th>
                  <th>Code</th>
                  <th>Speed</th>
                  <th>Data Limit</th>
                  <th>Price (INR)</th>
                  <th>GST Incl.</th>
                  <th>SAC Code</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Show on Dashboard</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                    <tr key={plan.id}>
                        <td>{plan.id}</td>
                        <td>{plan.name}</td>
                        <td>{plan.plan_code || 'N/A'}</td>
                        <td>{Number(plan.speed_mbps)} Mbps</td>
                        <td>{plan.data_limit_gb === null || plan.data_limit_gb === 0 ? 'Unlimited' : `${Number(plan.data_limit_gb)} GB`}</td>
                        <td>₹{Number(plan.price).toFixed(2)}</td>
                        <td>{plan.include_gst ? 'Yes' : 'No'}</td>
                        <td>{plan.sac_code || 'N/A'}</td>
                        <td>{plan.duration_days} days</td>
                        <td className={`status-${plan.is_active ? 'active' : 'inactive'}`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                        </td>
                        <td>{plan.show_on_customer_dashboard ? 'Yes' : 'No'}</td>
                        <td>
                            <button className="edit-button" onClick={() => handleEditClick(plan)}>Edit</button>
                            <button className="danger-button" onClick={() => handleDeleteClick(plan.id)}>Delete</button>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit Plan" : "Add New Plan"}>
        <form onSubmit={handleSavePlan}>
          <div className="form-group">
            <label htmlFor="name">Plan Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={currentPlan.name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="plan_code">Plan Code (Optional):</label>
            <input
              type="text"
              id="plan_code"
              name="plan_code"
              value={currentPlan.plan_code}
              onChange={handleFormChange}
              placeholder="e.g., FIBER100, ECO50"
            />
          </div>
          <div className="form-group">
            <label htmlFor="speed_mbps">Speed (Mbps):</label>
            <input
              type="number"
              id="speed_mbps"
              name="speed_mbps"
              value={currentPlan.speed_mbps}
              onChange={handleFormChange}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="data_limit_gb">Data Limit (GB, 0 for Unlimited, leave empty for no limit):</label>
            <input
              type="number"
              id="data_limit_gb"
              name="data_limit_gb"
              value={currentPlan.data_limit_gb}
              onChange={handleFormChange}
              min="0"
              placeholder="e.g., 100 or 0 for Unlimited"
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price (INR):</label>
            <input
              type="number"
              id="price"
              name="price"
              value={currentPlan.price}
              onChange={handleFormChange}
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="form-group checkbox-group">
            <label>GST Option:</label>
            <div>
                <input
                    type="radio"
                    id="include_gst_yes"
                    name="include_gst"
                    value={true}
                    checked={currentPlan.include_gst === true || currentPlan.include_gst === 'true'}
                    onChange={handleFormChange}
                />
                <label htmlFor="include_gst_yes" style={{marginRight: '15px'}}>Include GST</label>
                <input
                    type="radio"
                    id="include_gst_no"
                    name="include_gst"
                    value={false}
                    checked={currentPlan.include_gst === false || currentPlan.include_gst === 'false'}
                    onChange={handleFormChange}
                />
                <label htmlFor="include_gst_no">Exclude GST</label>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="sac_code">SAC Code (Optional):</label>
            <input
              type="text"
              id="sac_code"
              name="sac_code"
              value={currentPlan.sac_code}
              onChange={handleFormChange}
              placeholder="e.g., 998431"
            />
          </div>
          <div className="form-group">
            <label htmlFor="duration_days">Duration (Days):</label>
            <input
              type="number"
              id="duration_days"
              name="duration_days"
              value={currentPlan.duration_days}
              onChange={handleFormChange}
              min="1"
              required
            />
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={currentPlan.is_active}
              onChange={handleFormChange}
            />
            <label htmlFor="is_active">Is Active</label>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="show_on_customer_dashboard"
              name="show_on_customer_dashboard"
              checked={currentPlan.show_on_customer_dashboard}
              onChange={handleFormChange}
            />
            <label htmlFor="show_on_customer_dashboard">Show on Customer Dashboard</label>
          </div>
          <button type="submit" className="primary-button" disabled={formLoading}>
            {formLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Plan' : 'Add Plan')}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PlansPage;