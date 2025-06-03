// src/components/HewanForm.js
import React, { useState, useEffect } from 'react';

function HewanForm({ onSubmit, hewanToEdit, onCancel }) {
  const [hewan, setHewan] = useState({
    id: '',
    jenis: '',
    nama: '',
    umur: '', // Tetap string di state untuk kemudahan input
    pemilik: ''
  });
  const [formError, setFormError] = useState(''); // Ganti nama error agar tidak bentrok dengan App.js

  const isEditMode = !!hewanToEdit;

  useEffect(() => {
    if (hewanToEdit) {
      // Pastikan semua field dari hewanToEdit di-set, termasuk umur sebagai string
      setHewan({
        id: hewanToEdit.id || '',
        jenis: hewanToEdit.jenis || '',
        nama: hewanToEdit.nama || '',
        umur: hewanToEdit.umur !== undefined ? hewanToEdit.umur.toString() : '',
        pemilik: hewanToEdit.pemilik || ''
      });
    } else {
      setHewan({ id: '', jenis: '', nama: '', umur: '', pemilik: '' });
    }
    setFormError('');
  }, [hewanToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHewan(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(''); // Reset error setiap submit

    const umurStr = hewan.umur.trim();
    const umurInt = parseInt(umurStr, 10);

    if (!hewan.jenis.trim() || !hewan.nama.trim() || !hewan.pemilik.trim()) {
      setFormError("Jenis, Nama, dan Pemilik wajib diisi.");
      return;
    }
    if (umurStr === '' || isNaN(umurInt) || umurInt < 0) {
      setFormError("Umur harus berupa angka positif yang valid (misalnya 0, 1, 2, ...).");
      return;
    }
    if (!isEditMode && !hewan.id.trim()) {
      setFormError("ID Hewan wajib diisi untuk data baru.");
      return;
    }

    // Kirim data dengan umur sebagai integer
    const dataToSubmit = {
      ...hewan,
      umur: umurInt
    };

    // Untuk mode edit, ID tidak perlu ada di body jika backend mengambilnya dari path
    // if (isEditMode) {
    //   delete dataToSubmit.id; // Opsional, tergantung backend Anda
    // }


    console.log("Data yang akan disubmit dari form:", dataToSubmit);
    onSubmit(dataToSubmit); // Panggil fungsi onSubmit dari App.js
  };

  return (
    <div className="form-container" style={{ boxShadow: 'none', padding: '0' }}>
      {formError && <p className="error-message" style={{marginTop: 0}}>{formError}</p>}
      <form onSubmit={handleSubmit}>
        {!isEditMode && (
          <div className="form-group">
            <label htmlFor="id">ID Hewan:</label>
            <input type="text" name="id" id="id" value={hewan.id} onChange={handleChange} />
          </div>
        )}
        {isEditMode && <p><strong>ID:</strong> {hewan.id} (tidak dapat diubah)</p>}

        <div className="form-group">
          <label htmlFor="jenis">Jenis Hewan:</label>
          <input type="text" name="jenis" id="jenis" value={hewan.jenis} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="nama">Nama Hewan:</label>
          <input type="text" name="nama" id="nama" value={hewan.nama} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="umur">Umur (tahun):</label>
          <input type="number" name="umur" id="umur" value={hewan.umur} onChange={handleChange} min="0" placeholder="Contoh: 2"/>
        </div>
        <div className="form-group">
          <label htmlFor="pemilik">Nama Pemilik:</label>
          <input type="text" name="pemilik" id="pemilik" value={hewan.pemilik} onChange={handleChange} />
        </div>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" className="button-secondary" onClick={onCancel}>Batal</button>
          <button type="submit">{isEditMode ? 'Update Data' : 'Simpan Hewan'}</button>
        </div>
      </form>
    </div>
  );
}

export default HewanForm;