import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

const Toast = ({ message, type = 'success', visible }) => {
  if (!visible) return null;

  return (
    <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`flex items-center px-6 py-3 rounded-lg shadow-lg text-white text-base font-medium
        ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      >
        {type === 'success' ? (
          <CheckCircleIcon className="h-6 w-6 mr-2" />
        ) : (
          <ExclamationCircleIcon className="h-6 w-6 mr-2" />
        )}
        {message}
      </div>
    </div>
  );
};

export default Toast; 