import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import NewCustomerForm from '../components/NewCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import '../App.css';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers.');
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCustomerCreated = () => {
    setShowNewForm(false);
    fetchCustomers();
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleCustomerUpdated = () => {
    handleCloseModal();
    fetchCustomers();
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also affect their subscriptions and invoices.')) {
      try {
        await apiClient.delete(`/customers/${customerId}`);
        fetchCustomers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete customer.');
        console.error("Error deleting customer:", err);
      }
    }
  };

  return (
    <div className="page-container customers-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Customer Management</h2>
        <button className="primary-button" onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? 'Cancel' : 'Add New Customer'}
        </button>
      </div>

      {showNewForm && <NewCustomerForm onCustomerCreated={handleCustomerCreated} />}
      {error && <div className="alert error">{error}</div>}

      {isLoading ? (
        <p>Loading customers...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    {/* Link to Customer Details Page */}
                    <td><Link to={`/customers/${customer.id}`}>{customer.full_name}</Link></td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{customer.phone_number}</td>
                    <td>{customer.address}</td>
                    <td>
                      <button className="edit-button" onClick={() => handleOpenEditModal(customer)}>Edit</button>
                      <button className="danger-button" onClick={() => handleDelete(customer.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={isModalOpen} onClose={handleCloseModal} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        {editingCustomer && (
          <EditCustomerForm
            customer={editingCustomer}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;