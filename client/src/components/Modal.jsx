// client/src/components/Modal.jsx
import React from "react"; // Ensure React is imported if React.useEffect is used
import { Dialog } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import useFlashcardStore from "../store/flashcardStore";

function Modal() {
  const { isModalOpen, hideModal, modalContent } = useFlashcardStore();
  const { title, message, onConfirm, confirmText, cancelText } = modalContent;

  // Call useEffect at the top level
  React.useEffect(() => {
    // Only add/remove listener if the modal is intended to be interactive
    if (isModalOpen) {
      const handleEsc = (event) => {
        if (event.key === "Escape") {
          hideModal();
        }
      };
      window.addEventListener("keydown", handleEsc);

      // Cleanup function
      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isModalOpen, hideModal]); // Add isModalOpen to dependencies

  // Early return if modal is not open
  if (!isModalOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    hideModal();
  };

  const handleCancel = () => {
    hideModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 text-center dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 dark:text-gray-300">{message}</p>
        <div className="flex justify-center gap-4">
          {onConfirm && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              {confirmText}
            </button>
          )}
          <button
            onClick={handleCancel}
            className={`px-4 py-2 rounded-md ${onConfirm ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
