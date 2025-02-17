import React, { useState } from 'react';
import axios from 'axios';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { Toaster, toast } from 'react-hot-toast';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/admin/google', {
        token: credentialResponse.credential,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'admin');
      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('You don\'t have admin access.');
    }
  };
  // const handleSendOTP = async () => {
  //   if (!email) {
  //     toast.error('Please enter a valid email address');
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     await axios.post('http://localhost:5000/api/auth/admin', { email });
  //     toast.success('OTP sent successfully!');
  //     setStep(2);
  //   } catch (error) {
  //     toast.error(error.response?.data?.error || 'Failed to send OTP');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleVerifyOTP = async () => {
  //   if (!otp) {
  //     toast.error('Please enter the OTP');
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const res = await axios.post('http://localhost:5000/api/auth/admin/verify', { email, otp });
  //     localStorage.setItem('token', res.data.token);
  //     toast.success('Login successful! Redirecting...');
  //     setTimeout(() => window.location.href = '/admin/dashboard', 1500);
  //   } catch (error) {
  //     toast.error(error.response?.data?.error || 'Invalid OTP');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <div className=" absolute left-0 top-0 w-[100%] min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'bg-white text-gray-800 shadow-xl rounded-lg',
          duration: 3000,
        }}
      />
      
       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl ">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="bg-indigo-600 text-white rounded-lg px-3 py-1 mr-2">Admin</span>
            Portal
          </h1>
          <p className="text-gray-500">
          
          </p>
        </div>

        <div className="space-y-6">
        <div className="w-full max-w-md mx-auto"> 
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome
              </h1>
              <p className="text-gray-600">
                Access your admin dashboard with one click
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
      
      

          {/* {step === 1 ? (
            <>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>
              
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-pulse">Sending OTP...</span>
                ) : (
                  <>
                    <span>Continue</span>
                    <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-pulse">Verifying...</span>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium w-full text-center"
              >
                Back to Email Entry
              </button>
            </>
          )} */}
        </div>
{/* 
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Don't have access? Contact system administrator</p>
        </div> */}
      </div>
   
     </GoogleOAuthProvider>
  );
};

export default AdminLogin;