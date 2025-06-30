import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Modal from "./components/common/Modal";
import AuthModal from "./components/auth/AuthModal";
import Hero from "./components/Hero";
import HomePage from "./components/HomePage";
import TestPage from "./components/TestPage";
import ProblemList from "./components/ProblemList";
import { useAuth } from "./context/AuthContext";
import useFlashcardStore from "./store/flashcardStore";
import Toast from "./components/common/Toast";

function App() {
  const {
    fetchDecks,
    fetchFlashcards,
    toast,
    darkMode,
  } = useFlashcardStore();

  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/testing" element={<TestPage />} />
          <Route path="/problem-list" element={<ProblemList onBack={() => window.history.back()} />} />
        </Routes>
      </main>
      <Modal />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

export default App;
