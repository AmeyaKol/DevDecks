// import React from "react";
// import { Dialog } from "@headlessui/react"; // Using Headless UI for accessible modals
// import {
//   ExclamationTriangleIcon,
//   InformationCircleIcon,
// } from "@heroicons/react/24/outline";
// import useFlashcardStore from "../store/flashcardStore";

// function Modal() {
//   const { isModalOpen, hideModal, modalContent } = useFlashcardStore();
//   const { title, message, onConfirm, confirmText, cancelText } = modalContent;

//   if (!isModalOpen) return null;

//   const handleConfirm = () => {
//     if (onConfirm) {
//       onConfirm();
//     }
//     hideModal();
//   };

//   const handleCancel = () => {
//     hideModal();
//   };

//   // Add event listener for escape key
//   React.useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === "Escape") {
//         hideModal();
//       }
//     };
//     window.addEventListener("keydown", handleEsc);

//     return () => {
//       window.removeEventListener("keydown", handleEsc);
//     };
//   }, [hideModal]);

//   return (
//     <Dialog open={isModalOpen} onClose={hideModal} className="relative z-50">
//       <div
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm"
//         aria-hidden="true"
//       />
//       <div className="fixed inset-0 flex items-center justify-center p-4">
//         <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl p-0">
//           <div className="p-6">
//             <div className="sm:flex sm:items-start">
//               <div
//                 className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
//                   onConfirm ? "bg-red-100" : "bg-indigo-100"
//                 } sm:mx-0 sm:h-10 sm:w-10`}
//               >
//                 {onConfirm ? (
//                   <ExclamationTriangleIcon
//                     className="h-6 w-6 text-red-600"
//                     aria-hidden="true"
//                   />
//                 ) : (
//                   <InformationCircleIcon
//                     className="h-6 w-6 text-indigo-600"
//                     aria-hidden="true"
//                   />
//                 )}
//               </div>
//               <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
//                 <Dialog.Title
//                   as="h3"
//                   className="text-lg font-semibold leading-6 text-gray-900"
//                 >
//                   {title}
//                 </Dialog.Title>
//                 <div className="mt-2">
//                   <p className="text-sm text-gray-500">{message}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
//             {onConfirm && (
//               <button
//                 type="button"
//                 className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors"
//                 onClick={handleConfirm}
//               >
//                 {confirmText}
//               </button>
//             )}
//             <button
//               type="button"
//               className={`mt-3 inline-flex w-full justify-center rounded-md ${
//                 onConfirm
//                   ? "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
//                   : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
//               } px-4 py-2 text-sm font-semibold sm:mt-0 sm:w-auto transition-colors`}
//               onClick={handleCancel}
//             >
//               {onConfirm
//                 ? cancelText
//                 : cancelText === "Cancel"
//                 ? "OK"
//                 : cancelText}
//             </button>
//           </div>
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// }

// export default Modal;
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
    <Dialog open={isModalOpen} onClose={hideModal} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl p-0">
          <div className="p-6">
            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  onConfirm ? "bg-red-100" : "bg-indigo-100"
                } sm:mx-0 sm:h-10 sm:w-10`}
              >
                {onConfirm ? (
                  <ExclamationTriangleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                ) : (
                  <InformationCircleIcon
                    className="h-6 w-6 text-indigo-600"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
            {onConfirm && (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors"
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
            )}
            <button
              type="button"
              className={`mt-3 inline-flex w-full justify-center rounded-md ${
                onConfirm
                  ? "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
              } px-4 py-2 text-sm font-semibold sm:mt-0 sm:w-auto transition-colors`}
              onClick={handleCancel}
            >
              {onConfirm
                ? cancelText
                : cancelText === "Cancel"
                ? "OK"
                : cancelText}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default Modal;
