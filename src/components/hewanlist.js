// src/components/HewanList.js
import React from 'react';
// import '../App.css';

function HewanList({ hewanList, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <p className="loading-message">Memuat data hewan...</p>;
  }

  if (!hewanList || hewanList.length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '20px' }}>Belum ada data hewan.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nama</th>
          <th>Jenis</th>
          <th>Umur (thn)</th>
          <th>Pemilik</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {hewanList.map((hewan) => (
          <tr key={hewan.id}>
            <td>{hewan.id}</td>
            <td>{hewan.nama}</td>
            <td>{hewan.jenis}</td>
            <td>{hewan.umur}</td>
            <td>{hewan.pemilik}</td>
            <td>
              <button onClick={() => onEdit(hewan)}>Edit</button>
              <button className="button-danger" onClick={() => onDelete(hewan.id)}>Hapus</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default HewanList;