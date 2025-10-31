import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://backend-chatty-production.up.railway.app",
  withCredentials: true, // This is correct for sending cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to ensure credentials are included
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure withCredentials is always true
    config.withCredentials = true;
    
    // Add any auth tokens from localStorage if needed
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Authentication failed');
      // Optional: redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;