import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TestTab from './TestTab';
import Navbar from './Navbar';
import AnimatedDropdown from './common/AnimatedDropdown';

const TestPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') || 'all';
  const [testStarted, setTestStarted] = useState(false);

  const handleSectionChange = (option) => {
    setSearchParams({ section: option.value });
  };

  const sectionOptions = [
    { value: 'all', label: 'All Decks' },
    { value: 'technical', label: 'Technical' },
    { value: 'gre', label: 'GRE' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Navbar />
      {!testStarted && (
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <label htmlFor="section-filter" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              Select Deck Type
            </label>
            <AnimatedDropdown
              value={section}
              onChange={handleSectionChange}
              options={sectionOptions}
              placeholder="Select deck type"
            />
          </div>
        </div>
      )}
      <TestTab section={section} onTestStart={() => setTestStarted(true)} onTestEnd={() => setTestStarted(false)} />
    </div>
  );
};

export default TestPage; 