import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import '../App.css'; // Ensure main CSS is loaded

const NewCustomerForm = ({ onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiClient.post('/customers', formData);
      setFormData({ full_name: '', email: '', phone_number: '', address: '' });
      onCustomerCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer. Please check the details and try again.');
      console.error("Error creating customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{marginTop: '20px'}}>
      <h3>Add New Customer</h3>
      {error && <div className="alert error">{error}</div>}
      <div className="form-group">
        <label htmlFor="full_name">Full Name: </label>
        <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email: </label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="phone_number">Phone Number: </label>
        <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="address">Address: </label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required />
      </div>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
};

export default NewCustomerForm;