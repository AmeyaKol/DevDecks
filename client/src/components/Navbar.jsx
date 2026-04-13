import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFlashcardStore from '../store/flashcardStore';
import AuthModal from './auth/AuthModal';
import {
  HomeIcon,
  BeakerIcon,
  TableCellsIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { isGREMode, getNavigationLinks, getBasePath } from '../utils/greUtils';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useFlashcardStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  
  // Get navigation links based on current mode
  const navLinks = getNavigationLinks(location.pathname);
  const basePath = getBasePath(location.pathname);
  const inGREMode = isGREMode(location.pathname);
  const showAdminLink =
    isAuthenticated &&
    (user?.isAdmin || (user?.email || '').toLowerCase() === 'admin@flashcards.com');

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
      isActive
        ? 'bg-brand-600 text-white shadow-lg'
        : 'text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700'
    }`;

  return (
    <>
      {/* Wide screen layout */}
      <header className="container mx-auto px-4 py-8 mb-8">
        <div className="hidden lg:flex items-center justify-between px-4 sm:px-0">
          <Link to={basePath || '/'} className="flex items-center hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              <span className="hidden xs:inline">🧠</span> <span className="bg-gradient-to-r from-brand-600 to-amber-600 bg-clip-text text-transparent">
                {inGREMode ? 'DevDecks GRE' : 'DevDecks'}
              </span>
            </h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            <NavLink to={`${navLinks.home}?tab=content`} className={navLinkClasses}>
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </NavLink>
            <NavLink to={navLinks.test} className={navLinkClasses}>
              <BeakerIcon className="h-5 w-5 mr-2" />
              Test
            </NavLink>
            <NavLink to={navLinks.problemList} className={navLinkClasses}>
              <TableCellsIcon className="h-5 w-5 mr-2" />
              Problems
            </NavLink>
            {isAuthenticated && (
              <NavLink to={navLinks.profile} className={navLinkClasses}>
                <UserCircleIcon className="h-5 w-5 mr-2" />
                Profile
              </NavLink>
            )}
            {showAdminLink && (
              <NavLink to={navLinks.admin} className={navLinkClasses}>
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Admin
              </NavLink>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="flex items-center px-3 py-2 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* <div className="hidden sm:flex items-center space-x-2 text-sm text-stone-600 dark:text-stone-300">
                  <UserIcon className="h-4 w-4" />
                  <span>{user?.username}</span>
                </div> */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile/narrow screen layout */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
            <button
              onClick={toggleDarkMode}
              className="flex items-center px-3 py-2 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            
            <Link to={basePath || '/'} className="flex items-center hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                <span className="hidden xs:inline">🧠</span> <span className="bg-gradient-to-r from-brand-600 to-amber-600 bg-clip-text text-transparent">
                  {inGREMode ? 'DevDecks GRE' : 'DevDecks'}
                </span>
              </h1>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-stone-600 dark:text-stone-300">
                    <UserIcon className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-4 mb-8">
            <NavLink to={navLinks.home} className={navLinkClasses}>
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </NavLink>
            <NavLink to={navLinks.test} className={navLinkClasses}>
              <BeakerIcon className="h-5 w-5 mr-2" />
              Test
            </NavLink>
            <NavLink to={navLinks.problemList} className={navLinkClasses}>
              <TableCellsIcon className="h-5 w-5 mr-2" />
              Problems
            </NavLink>
            {isAuthenticated && (
              <NavLink to={navLinks.profile} className={navLinkClasses}>
                <UserCircleIcon className="h-5 w-5 mr-2" />
                Profile
              </NavLink>
            )}
            {showAdminLink && (
              <NavLink to={navLinks.admin} className={navLinkClasses}>
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Admin
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default Navbar; 