// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Ensure main CSS is loaded for styling

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userRole', response.data.user.role); // Store the user's role name

      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-box">
        <h2>Net Controller Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="alert error">{error}</p>}
          <button type="submit" className="primary-button">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;