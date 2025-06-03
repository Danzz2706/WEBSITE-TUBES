// src/components/StatsDisplay.js
import React, { useState, useEffect } from 'react';
import hewanService from '../service/hewanservice'; // Pastikan path ini benar

function StatsDisplay({ refreshTrigger }) { // Terima prop refreshTrigger
  const [stats, setStats] = useState({
    rataUmur: null,
    tuaMuda: null,
    perJenis: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        console.log("StatsDisplay: Fetching stats due to refreshTrigger change or initial load..."); // Log untuk debugging

        // Panggil semua endpoint statistik dari backend
        const rataDataPromise = hewanService.getRataRataUmur();
        const tuaMudaDataPromise = hewanService.getTemukanTuaMuda();
        const jenisDataPromise = hewanService.getStatistikJenis();

        // Tunggu semua promise selesai
        const [rataData, tuaMudaData, jenisData] = await Promise.all([
          rataDataPromise,
          tuaMudaDataPromise,
          jenisDataPromise
        ]);

        console.log("StatsDisplay: Raw rataData:", rataData);
        console.log("StatsDisplay: Raw tuaMudaData:", tuaMudaData);
        console.log("StatsDisplay: Raw jenisData:", jenisData);

        setStats({
          rataUmur: rataData.rataRataUmur, // Pastikan nama field sesuai dengan respons backend
          tuaMuda: tuaMudaData,           // Pastikan struktur tuaMudaData sesuai
          perJenis: jenisData,            // Pastikan jenisData adalah map[string]int
        });

      } catch (err) {
        const errorMessage = 'Gagal memuat statistik: ' + (err.message || 'Unknown error');
        setError(errorMessage);
        console.error("StatsDisplay Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Sekarang useEffect akan berjalan lagi setiap kali nilai 'refreshTrigger' berubah
  }, [refreshTrigger]); // Tambahkan refreshTrigger ke array dependensi

  if (loading) return <p className="loading-message">Memuat statistik...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="stats-container">
      <h2>Statistik Hewan</h2>
      {stats.rataUmur !== null && typeof stats.rataUmur !== 'undefined' ? ( // Pengecekan lebih aman
        <div className="stats-item">
          <strong>Rata-rata Umur Hewan:</strong> {stats.rataUmur.toFixed(2)} tahun
        </div>
      ) : <div className="stats-item"><strong>Rata-rata Umur Hewan:</strong> Data tidak tersedia</div>}

      {stats.tuaMuda && stats.tuaMuda.tertua ? (
        <div className="stats-item">
          <strong>Hewan Tertua:</strong> {stats.tuaMuda.tertua.nama} ({stats.tuaMuda.tertua.umur} tahun)
        </div>
      ) : <div className="stats-item"><strong>Hewan Tertua:</strong> Data tidak tersedia</div>}

      {stats.tuaMuda && stats.tuaMuda.termuda ? (
        <div className="stats-item">
          <strong>Hewan Termuda:</strong> {stats.tuaMuda.termuda.nama} ({stats.tuaMuda.termuda.umur} tahun)
        </div>
      ) : <div className="stats-item"><strong>Hewan Termuda:</strong> Data tidak tersedia</div>}

      {stats.perJenis && Object.keys(stats.perJenis).length > 0 ? (
        <div className="stats-item">
          <strong>Jumlah per Jenis:</strong>
          <ul style={{ listStylePosition: 'inside', paddingLeft: '0', marginTop: '5px' }}>
            {Object.entries(stats.perJenis).map(([jenis, jumlah]) => (
              <li key={jenis}>{jenis}: {jumlah}</li>
            ))}
          </ul>
        </div>
      ) : <div className="stats-item"><strong>Jumlah per Jenis:</strong> Data tidak tersedia atau kosong</div>}
    </div>
  );
}

export default StatsDisplay;