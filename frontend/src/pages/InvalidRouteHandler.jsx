import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InvalidRouteHandler = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect based on user role
    if (user) {
      if (user.role === 'admin' || user.role === 'teacher') {
        navigate('/adminPanel');
      } else if (user.role === 'user') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Page Not Found</h1>
      <p className="text-lg text-gray-700">Oops! The page you're looking for doesn't exist.</p>
      <p className="text-lg text-gray-700">Redirecting you to the appropriate page...</p>
    </div>
  );
};

export default InvalidRouteHandler;