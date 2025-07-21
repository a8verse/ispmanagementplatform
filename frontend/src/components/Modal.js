import React from 'react';
import '../App.css'; // Global CSS is loaded

const Modal = ({ show, onClose, children, title }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
            <h2>{title || "Modal Title"}</h2>
            <button className="modal-close-button" onClick={onClose}>
                &times;
            </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;