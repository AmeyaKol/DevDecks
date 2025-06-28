import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TestTab from './TestTab';
import Navbar from './Navbar';

const TestPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') || 'all';
  const [testStarted, setTestStarted] = useState(false);

  const handleSectionChange = (e) => {
    setSearchParams({ section: e.target.value });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Navbar />
      {!testStarted && (
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <label htmlFor="section-filter" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              Select Deck Type
            </label>
            <select
              id="section-filter"
              value={section}
              onChange={handleSectionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Decks</option>
              <option value="technical">Technical</option>
              <option value="gre">GRE</option>
            </select>
          </div>
        </div>
      )}
      <TestTab section={section} onTestStart={() => setTestStarted(true)} onTestEnd={() => setTestStarted(false)} />
    </div>
  );
};

export default TestPage; 