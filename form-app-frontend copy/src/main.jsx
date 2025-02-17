import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
 const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
ReactDOM.createRoot(document.getElementById('root')).render(
  
       
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
     
       
          <App />
        
      
    </GoogleOAuthProvider>
  


)