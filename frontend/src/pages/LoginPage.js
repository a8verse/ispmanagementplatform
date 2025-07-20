import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    setError('');

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });

      // On successful login, save the token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to the dashboard (we will create this next)
      window.location.href = '/dashboard';

    } catch (err) {
      setError('Invalid username or password.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>ISP Management Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;