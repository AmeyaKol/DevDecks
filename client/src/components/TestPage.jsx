import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import TestTab from './TestTab';
import Navbar from './Navbar';
import AnimatedDropdown from './common/AnimatedDropdown';
import { isGREMode, getTestSection, getNavigationLinks } from '../utils/greUtils';

const TestPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auto-detect section based on URL mode instead of using search params
  const section = getTestSection(location.pathname);
  const deckId = searchParams.get('deck');
  const [testStarted, setTestStarted] = useState(false);
  
  // Get navigation links for proper redirects
  const navLinks = getNavigationLinks(location.pathname);

  // Check if we're on the /testing or /gre/testing route with a deck
  const isTestingRoute = (location.pathname === '/testing' || location.pathname === '/gre/testing') && deckId;

  useEffect(() => {
    // If we're on /testing route with a deck, start the test automatically
    if (isTestingRoute) {
      setTestStarted(true);
    } else if ((location.pathname === '/testing' || location.pathname === '/gre/testing') && !deckId) {
      // If on /testing or /gre/testing without deck, redirect to appropriate test page
      navigate(navLinks.test);
    }
  }, [isTestingRoute, deckId, location.pathname, navigate]);

  // Section is now auto-detected based on URL, no need for manual selection

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
            navigate(navLinks.test);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Navbar />
      <TestTab 
        section={section} 
        onTestStart={() => setTestStarted(true)} 
        onTestEnd={() => setTestStarted(false)} 
      />
    </div>
  );
};

export default TestPage; 