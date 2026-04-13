import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Modal from "./components/common/Modal";
import AuthModal from "./components/auth/AuthModal";
import { useAuth } from "./context/AuthContext";
import useFlashcardStore from "./store/flashcardStore";
import Toast from "./components/common/Toast";
import Footer from "./components/Footer";
import MarkdownPage from "./components/common/MarkdownPage";
import { hasVisitedThisSession } from "./utils/sessionManager";

const Hero = React.lazy(() => import("./components/Hero"));
const HomePage = React.lazy(() => import("./components/HomePage"));
const DeckView = React.lazy(() => import("./components/DeckView"));
const FolderView = React.lazy(() => import("./components/FolderView"));
const StudyView = React.lazy(() => import("./components/StudyView"));
const TestPage = React.lazy(() => import("./components/TestPage"));
const ProblemList = React.lazy(() => import("./components/ProblemList"));
const Profile = React.lazy(() => import("./components/Profile"));
const EODRevisionView = React.lazy(() => import("./components/EODRevisionView"));
const NotFound = React.lazy(() => import("./components/NotFound"));
const LandingPage = React.lazy(() => import("./components/LandingPage"));
const LandingPageWrapper = React.lazy(() => import("./components/LandingPageWrapper"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

/**
 * SessionBasedRoot Component
 * Decides whether to show LandingPage or Hero based on session state
 */
const SessionBasedRoot = () => {
  const hasVisited = hasVisitedThisSession();
  
  if (hasVisited) {
    return <Hero />;
  }
  
  return <LandingPageWrapper />;
};

function App() {
  const {
    toast,
    darkMode,
  } = useFlashcardStore();

  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <Suspense fallback={<div className="p-6 text-gray-600 dark:text-gray-300">Loading...</div>}>
        <Routes>
          {/* Landing Page - Full page layout */}
          <Route path="/landing" element={<LandingPage />} />
          
          {/* Regular routes - With container layout */}
          <Route path="/*" element={
            <div className="min-h-screen bg-gradient-to-br from-warm-50 via-warm-100 to-amber-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300">
              <main className="w-full max-w-[1920px] mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<SessionBasedRoot />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/deckView" element={<DeckView />} />
                  <Route path="/folderView" element={<FolderView />} />
                  <Route path="/study" element={<StudyView />} />
                  <Route path="/test" element={<TestPage />} />
                  <Route path="/testing" element={<TestPage />} />
                  <Route path="/problem-list" element={<ProblemList onBack={() => window.history.back()} />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/eod-revision" element={<EODRevisionView />} />
                  <Route path="/about" element={<MarkdownPage file="about.md" />} />
                  <Route path="/changelog" element={<MarkdownPage file="changelog.md" />} />
                  
                  {/* GRE routes */}
                  <Route path="/gre" element={<Hero />} />
                  <Route path="/gre/home" element={<HomePage />} />
                  <Route path="/gre/deckView" element={<DeckView />} />
                  <Route path="/gre/folderView" element={<FolderView />} />
                  <Route path="/gre/study" element={<StudyView />} />
                  <Route path="/gre/test" element={<TestPage />} />
                  <Route path="/gre/testing" element={<TestPage />} />
                  <Route path="/gre/problem-list" element={<ProblemList onBack={() => window.history.back()} />} />
                  <Route path="/gre/profile" element={<Profile />} />
                  <Route path="/gre/admin" element={<AdminDashboard />} />
                  <Route path="/gre/eod-revision" element={<EODRevisionView />} />
                  <Route path="/gre/about" element={<MarkdownPage file="about.md" />} />
                  <Route path="/gre/changelog" element={<MarkdownPage file="changelog.md" />} />
                  
                  {/* 404 route - must be last */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Suspense>

      <Modal />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

export default App;
