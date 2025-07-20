import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await apiClient.get('/plans');
        setPlans(response.data);
      } catch (err) {
        setError('Failed to fetch plans.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []); // Empty array ensures this runs only once on component load

  if (isLoading) {
    return <p>Loading plans...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Plan Management</h2>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Plan Name</th>
            <th>Speed</th>
            <th>Data Limit</th>
            <th>Price (INR)</th>
            <th>Duration (Days)</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td>{plan.id}</td>
              <td>{plan.name}</td>
              <td>{plan.speed_mbps} Mbps</td>
              <td>{plan.data_limit_gb === 0 ? 'Unlimited' : `${plan.data_limit_gb} GB`}</td>
              <td>₹{plan.price}</td>
              <td>{plan.duration_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlansPage;