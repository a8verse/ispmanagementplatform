import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import NewCustomerForm from '../components/NewCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm'; // Import Edit Form
import Modal from '../components/Modal'; // Import Modal

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  // --- NEW: State for Edit Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  // ---------------------------------

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers.');
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

  // --- NEW: Handlers for Edit Modal ---
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
  // ------------------------------------

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await apiClient.delete(`/customers/${customerId}`);
        fetchCustomers();
      } catch (err) {
        setError('Failed to delete customer.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Customer Management</h2>
        <button onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? 'Cancel' : 'Add New Customer'}
        </button>
      </div>

      {showNewForm && <NewCustomerForm onCustomerCreated={handleCustomerCreated} />}

      {/* Table rendering logic (no changes here)... */}
     <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
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
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone_number}</td>
                  <td>{customer.address}</td>
                  <td>
                    <button onClick={() => handleOpenEditModal(customer)} style={{ marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDelete(customer.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

      {/* --- NEW: Render the Modal --- */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        {editingCustomer && (
          <EditCustomerForm
            customer={editingCustomer}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}
      </Modal>
      {/* ----------------------------- */}
    </div>
  );
};

export default CustomersPage;	