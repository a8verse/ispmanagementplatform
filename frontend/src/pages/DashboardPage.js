import React from 'react';

const DashboardPage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {user ? user.username : 'User'}!</p>
      <p>This is the main dashboard where you can see an overview of your ISP operations.</p>
    </div>
  );
};

export default DashboardPage;