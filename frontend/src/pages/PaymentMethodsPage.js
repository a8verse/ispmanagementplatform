import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import Modal from '../components/Modal'; // We'll reuse our modal component

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the form (for both adding and editing)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodName, setMethodName] = useState('');

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/payment-methods');
      setMethods(response.data);
    } catch (err) {
      setError('Failed to fetch payment methods.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpenModal = (method = null) => {
    setEditingMethod(method);
    setMethodName(method ? method.name : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setMethodName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        // Update existing method
        await apiClient.put(`/payment-methods/${editingMethod.id}`, { name: methodName, is_active: editingMethod.is_active });
      } else {
        // Create new method
        await apiClient.post('/payment-methods', { name: methodName });
      }
      fetchMethods();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save payment method.');
    }
  };

  const handleDelete = async (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await apiClient.delete(`/payment-methods/${methodId}`);
        fetchMethods();
      } catch (err) {
        setError('Failed to delete payment method.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Payment Methods</h2>
        <button onClick={() => handleOpenModal()}>Add New Method</button>
      </div>

      {isLoading ? <p>Loading...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Method Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id}>
                <td>{method.id}</td>
                <td>{method.name}</td>
                <td>{method.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button onClick={() => handleOpenModal(method)} style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDelete(method.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit}>
          <h4>{editingMethod ? 'Edit' : 'Add New'} Payment Method</h4>
          <div style={{ margin: '10px 0' }}>
            <label>Method Name: </label>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              required
            />
          </div>
          <button type="submit">{editingMethod ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentMethodsPage;