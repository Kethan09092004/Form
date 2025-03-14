import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import AdminLogin from './components/AdminLogin';
import PublicForm from './components/PublicForm';
import ViewResponse from './components/ViewResponse';
import AfterSubmission from './components/AfterSubmission';
//import NotFound from './components/NotFound'; // Add a 404 page

// Lazy load components for better performance
const FacultyDashboard = lazy(() => import('./components/FacultyDashBoard'));
const AdminDashboard = lazy(() => import('./components/AdminDahsboard'));

function App() {
  return (
    <BrowserRouter>
      
     
      
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          // <ProtectedRoute>
          //   <Home />
          // // </ProtectedRoute>
          <Home />
        } />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/form/:link" element={<PublicForm />} />
        <Route path="/responses/:formId" element={<ViewResponse />} />
         <Route path="/submitted" element={<AfterSubmission/>}/>
        {/* Protected Routes */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className='absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100'>Loading...</div>}>
                <FacultyDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className='absolute left-0 top-0 w-[100%] flex items-center justify-center min-h-screen bg-gray-100'>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 404 Page */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;