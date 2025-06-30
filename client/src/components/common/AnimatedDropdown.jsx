import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const AnimatedDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ease-in-out hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 dark:hover:border-indigo-400 cursor-pointer flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Options */}
      <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg overflow-hidden transition-all duration-200 ease-in-out ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      }`}>
        <div className="max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-150 ${
                option.value === value 
                  ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100' 
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedDropdown; 