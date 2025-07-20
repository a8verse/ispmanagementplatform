import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';

// This component takes a function `onCustomerCreated` as a prop
// to notify the parent component when a customer is added.
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
      // On success, clear the form and call the parent's function
      setFormData({ full_name: '', email: '', phone_number: '', address: '' });
      onCustomerCreated(); // Notify parent to refresh the list
    } catch (err) {
      setError('Failed to create customer. Please check the details and try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', marginTop: '20px' }}>
      <h4>Add New Customer</h4>
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
        {isSubmitting ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
};

export default NewCustomerForm;