import React from 'react';
import './Modal.css';

// This component takes props to control its visibility (isOpen),
// a function to close it (onClose), and the content to display (children).
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null; // Don't render anything if the modal is not open
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;