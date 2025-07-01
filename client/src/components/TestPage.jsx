import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import TestTab from './TestTab';
import Navbar from './Navbar';
import AnimatedDropdown from './common/AnimatedDropdown';
import Footer from './Footer';

const TestPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const section = searchParams.get('section') || 'all';
  const deckId = searchParams.get('deck');
  const [testStarted, setTestStarted] = useState(false);

  // Check if we're on the /testing route with a deck
  const isTestingRoute = location.pathname === '/testing' && deckId;

  useEffect(() => {
    // If we're on /testing route with a deck, start the test automatically
    if (isTestingRoute) {
      setTestStarted(true);
    } else if (location.pathname === '/testing' && !deckId) {
      // If on /testing without deck, redirect to /test
      navigate('/test');
    }
  }, [isTestingRoute, deckId, location.pathname, navigate]);

  const handleSectionChange = (option) => {
    setSearchParams({ section: option.value });
  };

  const sectionOptions = [
    { value: 'all', label: 'All Decks' },
    { value: 'technical', label: 'Technical' },
    { value: 'gre', label: 'GRE' }
  ];

  // If we're testing a specific deck, pass it directly to TestTab
  if (isTestingRoute) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        <TestTab 
          section={section} 
          deckId={deckId}
          onTestStart={() => setTestStarted(true)} 
          onTestEnd={() => {
            setTestStarted(false);
            navigate('/test');
          }} 
        />
        <Footer />
      </div>
    );
  }

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
      <TestTab 
        section={section} 
        onTestStart={() => setTestStarted(true)} 
        onTestEnd={() => setTestStarted(false)} 
      />
    </div>
  );
};

export default TestPage; 