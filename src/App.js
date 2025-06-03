// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import NavigationBar from './components/navigationbar';
import HewanList from './components/hewanlist';
import HewanForm from './components/hewanForm';
import StatsDisplay from './components/statsdisplay'; // Pastikan ini diimpor
import Modal from './components/Modal';
import hewanService from './service/hewanservice';

function App() {
  const [hewanList, setHewanList] = useState([]);
  const [selectedHewan, setSelectedHewan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  // State baru untuk memicu refresh statistik
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  const loadHewan = useCallback(async () => {
    setIsLoading(true);
    // setError(null); // Jangan reset error di sini agar error submit tetap terlihat
    try {
      const params = {
        nama: searchTerm,
        sortBy: sortBy,
        order: sortOrder,
      };
      Object.keys(params).forEach(key => (params[key] === '' || params[key] === null) && delete params[key]);
      const data = await hewanService.getAllHewan(params);
      setHewanList(data);
    } catch (err) {
      setError("Gagal memuat data hewan: " + err.message);
      console.error("Error di loadHewan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    loadHewan();
  }, [loadHewan]);

  // Fungsi yang akan dipanggil setiap kali data hewan berubah
  const triggerDataRefresh = () => {
    console.log("App.js: Memicu data refresh (hewan list & stats)...");
    loadHewan(); // Muat ulang daftar hewan
    setStatsRefreshTrigger(prev => prev + 1); // Ubah nilai trigger untuk me-refresh statistik
  };


  const openModalForTambah = () => {
    setSelectedHewan(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (hewan) => {
    setSelectedHewan(hewan);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHewan(null);
  };

  const handleFormSubmit = async (hewanData) => {
    let success = false;
    try {
      if (selectedHewan) {
        await hewanService.updateHewan(selectedHewan.id, hewanData);
      } else {
        await hewanService.tambahHewan(hewanData);
      }
      success = true;
    } catch (err) {
      setError("Gagal menyimpan data hewan: " + err.message);
      console.error("Error di handleFormSubmit:", err);
    }

    if (success) {
      closeModal();
      triggerDataRefresh(); // Panggil fungsi refresh data gabungan
      setError(null);
    }
  };

  const handleDeleteHewan = async (idHewan) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data hewan ini?")) {
      setError(null);
      try {
        await hewanService.hapusHewan(idHewan);
        triggerDataRefresh(); // Panggil fungsi refresh data gabungan
      } catch (err) {
        setError("Gagal menghapus data hewan: " + err.message);
        console.error(err);
      }
    }
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    // Setelah sorting, tidak perlu triggerDataRefresh karena loadHewan akan dipanggil oleh useEffect-nya sendiri
    // karena sortBy atau sortOrder (dependensinya) berubah.
  };


  return (
    <div className="App">
      <NavigationBar onTambahHewanClick={openModalForTambah} />
      <main className="main-content">
        {error && <p className="error-message">{error}</p>}
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="Cari berdasarkan nama hewan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // loadHewan akan dipanggil oleh useEffect-nya
            style={{ padding: '10px', fontSize: '1em', flexGrow: 1, borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
            <span>Urutkan berdasarkan: </span>
            <button onClick={() => handleSort('id')}>ID {sortBy === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
            <button onClick={() => handleSort('nama')}>Nama {sortBy === 'nama' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
            <button onClick={() => handleSort('jenis')}>Jenis {sortBy === 'jenis' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
            <button onClick={() => handleSort('umur')}>Umur {sortBy === 'umur' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
            <button onClick={() => handleSort('pemilik')}>Pemilik {sortBy === 'pemilik' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</button>
        </div>

        <HewanList
          hewanList={hewanList}
          onEdit={openModalForEdit}
          onDelete={handleDeleteHewan}
          isLoading={isLoading}
        />
        {/* Lewatkan prop refreshTrigger ke StatsDisplay */}
        <StatsDisplay refreshTrigger={statsRefreshTrigger} />
      </main>
      <Modal
        show={isModalOpen}
        onClose={closeModal}
        title={selectedHewan ? "Edit Data Hewan" : "Tambah Hewan Baru"}
      >
        <HewanForm
          onSubmit={handleFormSubmit}
          hewanToEdit={selectedHewan}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
export default App;