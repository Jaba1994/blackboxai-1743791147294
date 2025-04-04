import axios from 'axios';
import { useToast } from '@/store/toastStore';

// Create axios instance with custom config
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage')).state.token
      : null;

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const toast = useToast();

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear storage and redirect to login
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          // Not found
          toast.error('The requested resource was not found.');
          break;

        case 422:
          // Validation error
          const validationErrors = error.response.data.errors;
          if (validationErrors) {
            Object.values(validationErrors).forEach(error => {
              toast.error(error[0]);
            });
          } else {
            toast.error('Validation failed. Please check your input.');
          }
          break;

        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          // Server error
          toast.error('An internal server error occurred. Please try again later.');
          break;

        default:
          // Other errors
          toast.error(
            error.response.data.message ||
            'An unexpected error occurred. Please try again.'
          );
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('No response received from server. Please check your connection.');
    } else {
      // Error in request configuration
      toast.error('An error occurred while sending the request.');
    }

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }

    return Promise.reject(error);
  }
);

export default instance;