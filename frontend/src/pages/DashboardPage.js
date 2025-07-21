// frontend/src/pages/DashboardPage.js
import React from 'react';
import '../App.css'; // Global CSS is loaded

const DashboardPage = () => {
  const user = JSON.parse(localStorage.getItem('user')); // Retrieve user data from localStorage

  return (
    <div className="page-container dashboard-page">
      <h2>Dashboard</h2>
      <p>Welcome, {user ? user.username : 'User'}!</p> {/* Display logged-in username */}
      <p>This is the main dashboard where you can see an overview of your ISP operations.</p>
      {/* You can add charts, key metrics, and quick links here later */}
    </div>
  );
};

export default DashboardPage;