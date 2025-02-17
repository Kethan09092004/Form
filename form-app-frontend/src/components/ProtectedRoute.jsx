import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast'; // Ensure react-hot-toast is installed
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    // Check if the user is trying to access a protected route without a token
    if (!token) {
      if (currentPath.includes('/admin/dashboard')) {
        toast.error('Please Login as Admin First');
      } else if (currentPath.includes('/faculty')) {
        toast.error('Please Login as Faculty First');
      } else {
        toast.error('Please Login to access this page');
      }
    }
  }, [token, currentPath]);

  // If no token, redirect based on the route
  if (!token) {
    if (currentPath.includes('/admin/dashboard')) {
      return <Navigate to="/admin" replace />;
    } else if (currentPath.includes('/faculty')) {
      return <Navigate to="/" replace />;
    } else {
      // For any other protected route, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // If token exists, allow access to the requested route
  return children;
};

export default ProtectedRoute;