import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // Your backend URL
});

// Request Interceptor: Runs before every request is sent
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, add it to the request headers
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors here
    return Promise.reject(error);
  }
);

export default apiClient;