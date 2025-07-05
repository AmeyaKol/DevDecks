import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoginForm from '../LoginForm';
import RegisterForm from '../RegisterForm';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  const handleSwitchToRegister = () => setIsLogin(false);
  const handleSwitchToLogin = () => setIsLogin(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-8 relative transform transition-all duration-300 ease-in-out dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin 
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                !isLogin 
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {isLogin ? (
          <LoginForm 
            onSwitchToRegister={handleSwitchToRegister}
            onClose={onClose}
          />
        ) : (
          <RegisterForm 
            onSwitchToLogin={handleSwitchToLogin}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal; 