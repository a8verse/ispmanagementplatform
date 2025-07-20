import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const EditCustomerForm = ({ customer, onCustomerUpdated }) => {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone_number: '', address: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When the 'customer' prop changes, update the form data
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
      // Send a PUT request to update the customer
      await apiClient.put(`/customers/${customer.id}`, formData);
      onCustomerUpdated(); // Notify parent to refresh list and close modal
    } catch (err) {
      setError('Failed to update customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Edit Customer (ID: {customer.id})</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '10px' }}>
        <label>Full Name: </label>
        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Email: </label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Phone Number: </label>
        <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Address: </label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} required />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Customer'}
      </button>
    </form>
  );
};

export default EditCustomerForm;