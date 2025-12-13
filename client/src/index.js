import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import queryClient from './lib/queryClient';
import './index.css'; // Tailwind CSS import
import App from './App';

// Set default mode to dark mode on first load
if (!document.documentElement.classList.contains('dark')) {
  document.documentElement.classList.add('dark');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <App />
                </Router>
            </AuthProvider>
            {/* React Query Devtools - only shows in development */}
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </QueryClientProvider>
    </React.StrictMode>
);