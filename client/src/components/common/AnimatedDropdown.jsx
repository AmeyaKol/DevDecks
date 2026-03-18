import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const AnimatedDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  disabled = false,
  className = "",
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledSetIsOpen || setInternalIsOpen;

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
        className={`w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-white transition-all duration-200 ease-in-out hover:border-brand-400 dark:hover:border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 cursor-pointer flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className={selectedOption ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-4 w-4 text-stone-400 dark:text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Options */}
      <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-md shadow-lg overflow-hidden transition-all duration-200 ease-in-out ${
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
              className={`w-full px-3 py-2 text-left hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors duration-150 ${
                option.value === value 
                  ? 'bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-brand-100' 
                  : 'text-stone-900 dark:text-white'
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