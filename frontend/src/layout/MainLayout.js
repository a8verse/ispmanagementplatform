// frontend/src/layout/MainLayout.js
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import '../App.css'; // Global CSS is loaded via App.js now

const MainLayout = ({ userRole }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const getLinkClass = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="main-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>Net Controller</h3>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li><Link to="/dashboard" className={getLinkClass("/dashboard")}>Dashboard</Link></li>
                        <li><Link to="/customers" className={getLinkClass("/customers")}>Customers</Link></li>
                        <li><Link to="/plans" className={getLinkClass("/plans")}>Plans</Link></li>
                        <li><Link to="/billing" className={getLinkClass("/billing")}>Billing</Link></li>

                        {/* Conditional rendering for Admin/Manager specific links */}
                        {(userRole === 'Admin' || userRole === 'Manager') && (
                            <>
                                <li><Link to="/payment-methods" className={getLinkClass("/payment-methods")}>Payment Methods</Link></li>
                                <li><Link to="/payments/approval" className={getLinkClass("/payments/approval")}>Payment Approvals</Link></li>
                            </>
                        )}
                    </ul>
                </nav>
            </aside>
            <main className="main-content">
                <header className="main-header">
                    <h1>Welcome to Net Controller</h1>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;