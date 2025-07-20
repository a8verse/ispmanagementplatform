import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';

// Import Layout and Pages
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage'; // 
import './App.css';
import './layout/MainLayout.css';
import PlansPage from './pages/PlansPage';
import BillingPage from './pages/BillingPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage'; 

// Component to check for authentication
const ProtectedRoutes = () => {
  const token = localStorage.getItem('token');
  // If a token exists, render the MainLayout, which in turn renders the child pages (Outlet).
  // Otherwise, redirect to the login page.
  return token ? <MainLayout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoutes />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          {/* USE THE REAL COMPONENT HERE 👇 */}
          <Route path="plans" element={<PlansPage />} />
          <Route path="billing" element={<BillingPage />} />
		  <Route path="payment-methods" element={<PaymentMethodsPage />} /> 
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;