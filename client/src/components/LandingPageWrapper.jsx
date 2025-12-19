import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';
import { hasVisitedThisSession, markSessionVisited } from '../utils/sessionManager';

/**
 * LandingPageWrapper Component
 * Wraps LandingPage with session-based logic
 * Shows welcome banner for authenticated users
 * Handles navigation with session marking
 */
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Handler for when user clicks any navigation button
  const handleNavigate = (path) => {
    markSessionVisited();
    navigate(path);
  };

  // Don't render if already visited (prevents flash before redirect)
  if (hasVisitedThisSession()) {
    return null;
  }

  return (
    <LandingPage 
      onNavigate={handleNavigate}
      showWelcomeBanner={isAuthenticated}
      userName={user?.username}
    />
  );
};

export default LandingPageWrapper;



