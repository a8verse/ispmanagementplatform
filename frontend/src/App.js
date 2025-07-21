// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout and Page Components
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import PlansPage from './pages/PlansPage';
import BillingPage from './pages/BillingPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ManualPaymentsApprovalPage from './pages/ManualPaymentsApprovalPage';

import './App.css'; // Your consolidated global CSS

const ProtectedRoutes = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  return token ? <MainLayout userRole={userRole} /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoutes />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="payments/approval" element={<ManualPaymentsApprovalPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;