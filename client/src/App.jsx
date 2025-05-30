import React from "react";
import FlashcardForm from "./components/FlashcardForm";
import FlashcardList from "./components/FlashcardList";
import Modal from "./components/Modal"; // Import the Modal component

function App() {
  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Study Helper: DSA & System Design
          </h1>
          <p className="text-gray-600 mt-2">
            Create and review your personalized flashcards. (MERN Version)
          </p>
        </header>

        <FlashcardForm />

        <section id="flashcards-display">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
            Your Flashcards
          </h2>
          <FlashcardList />
        </section>
      </div>
      <Modal /> {/* Add Modal to the App component tree */}
      /*{" "}
    </>
  );
}

export default App;
