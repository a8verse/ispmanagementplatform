import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="main-layout">
      <div className="sidebar">
        <h3>A8 ISP</h3>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/plans">Plans</Link>
          <Link to="/billing">Billing</Link>
		  <hr style={{margin: '20px 0'}} />
<Link to="/payment-methods">Payment Methods</Link>
        </nav>
      </div>
      <div className="main-content">
        <header className="header">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </header>
        <main className="content-area">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;