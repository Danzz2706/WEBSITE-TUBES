// src/components/NavigationBar.js
import React from 'react';
// import '../App.css'; // CSS sudah diimpor di App.js

function NavigationBar({ onTambahHewanClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">Pendataan Hewan Peliharaan</div>
      <div className="navbar-actions">
        <button onClick={onTambahHewanClick}>Tambah Hewan Baru</button>
      </div>
    </nav>
  );
}

export default NavigationBar;