import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://backend-chatty-production.up.railway.app",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
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
      // Handle unauthorized access - clear token and redirect
      localStorage.removeItem('authToken');
      window.location.href = '/login'; // Adjust redirect as needed
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;