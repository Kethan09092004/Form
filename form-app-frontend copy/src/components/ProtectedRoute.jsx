// src/components/ProtectedRoute.jsx
// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast'; // Make sure you have react-toastify installed

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const currentPath = location.pathname;
  
  if (!token) {
    // Determine if user is trying to access admin or faculty dashboard
    if (currentPath.includes('/admin/dashboard')) {
      toast.error("Plese Login as Admin First");
      return <Navigate to="/admin" replace />;
    } else if (currentPath.includes('/faculty')) {
      toast.error("Plese Login as Faculty First");
      return <Navigate to="/" replace />;
    } else {
      // For any other protected route
      toast.error("Please Login to access this page");
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;