import { useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Check if the user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/faculty'); // Redirect if token exists
    }
  }, [navigate]);

  const handleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/google', {
        token: credentialResponse.credential,
      });

      console.log(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'faculty');

      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/faculty'); // Correct way to redirect
      }, 1500);
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Login failed. Please check if you are registered.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="absolute left-0 top-0 w-[100%] min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'bg-white text-gray-800 shadow-xl rounded-lg',
            duration: 3000,
          }}
        />
        
        {/* Added mx-auto for horizontal centering */}
        <div className="w-full max-w-md mx-auto"> 
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome
              </h1>
              <p className="text-gray-600">
                Access your faculty dashboard with one click
              </p>
            </div>

            {/* Centered Google Login Button */}
            <div className="flex justify-center">
              <GoogleLogin 
                onSuccess={handleLogin}
                onError={() => toast.error('Google login failed. Please try again.')}
                theme="filled_blue"
                size="large"
                shape="pill"
                text="signin_with"
              />
            </div>

            {/* Footer Text */}
            <p className="text-sm text-gray-500 text-center mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Home;
