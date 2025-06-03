// src/components/Modal.js
import React from 'react';
// import '../App.css';

function Modal({ show, onClose, title, children }) {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default Modal;