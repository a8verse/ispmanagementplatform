import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import '../App.css'; // Ensure main CSS is loaded

const EditCustomerForm = ({ customer, onCustomerUpdated }) => {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone_number: '', address: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name || '',
        email: customer.email || '',
        phone_number: customer.phone_number || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.put(`/customers/${customer.id}`, formData);
      onCustomerUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer.');
      console.error("Error updating customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Edit Customer (ID: {customer.id})</h3>
      {error && <div className="alert error">{error}</div>}
      <div className="form-group">
        <label htmlFor="edit_full_name">Full Name: </label>
        <input type="text" id="edit_full_name" name="full_name" value={formData.full_name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="edit_email">Email: </label>
        <input type="email" id="edit_email" name="email" value={formData.email} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label htmlFor="edit_phone_number">Phone Number: </label>
        <input type="text" id="edit_phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="edit_address">Address: </label>
        <input type="text" id="edit_address" name="address" value={formData.address} onChange={handleChange} required />
      </div>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Customer'}
      </button>
    </form>
  );
};

export default EditCustomerForm;