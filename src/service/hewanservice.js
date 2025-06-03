// src/services/hewanService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/hewan'; // Pastikan port sesuai dengan backend Go

// Fungsi helper untuk logging error axios yang lebih detail
const handleAxiosError = (error, context) => {
  console.error(`Error during ${context}:`, error);
  if (error.response) {
    // Server merespons dengan status code di luar range 2xx
    console.error(`[${context}] Data:`, error.response.data);
    console.error(`[${context}] Status:`, error.response.status);
    console.error(`[${context}] Headers:`, error.response.headers);
    // Coba ambil pesan error dari respons server jika ada
    if (error.response.data && error.response.data.error) {
      throw new Error(`Server error: ${error.response.data.error} (Status: ${error.response.status})`);
    }
    throw new Error(`Server responded with status ${error.response.status} during ${context}.`);
  } else if (error.request) {
    // Request dibuat tapi tidak ada respons diterima (misalnya, server down, network error)
    console.error(`[${context}] No response received:`, error.request);
    throw new Error(`No response from server during ${context}. Is the backend running?`);
  } else {
    // Sesuatu terjadi saat setup request yang menyebabkan error
    console.error(`[${context}] Error setting up request:`, error.message);
    throw new Error(`Error setting up request during ${context}: ${error.message}`);
  }
};


const getAllHewan = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'getAllHewan');
  }
};

const tambahHewan = async (dataHewan) => {
  try {
    console.log("Mengirim data untuk tambah hewan:", dataHewan); // Log data yang akan dikirim
    const response = await axios.post(API_URL, dataHewan, {
      headers: {
        'Content-Type': 'application/json', // Eksplisit set header
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'tambahHewan');
  }
};

const updateHewan = async (id, dataHewan) => {
  try {
    console.log(`Mengirim data untuk update hewan ID ${id}:`, dataHewan); // Log data yang akan dikirim
    // Hapus ID dari body jika backend mengambil ID dari path
    // const { id: hewanId, ...payload } = dataHewan;
    const response = await axios.put(`${API_URL}/${id}`, dataHewan, { // Kirim dataHewan (atau payload)
      headers: {
        'Content-Type': 'application/json', // Eksplisit set header
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, `updateHewan (ID: ${id})`);
  }
};

const hapusHewan = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    // Biasanya tidak ada data yang dikembalikan untuk DELETE
  } catch (error) {
    handleAxiosError(error, `hapusHewan (ID: ${id})`);
  }
};

const getRataRataUmur = async () => {
  try {
    const response = await axios.get(`${API_URL}/statistik/rata-umur`);
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'getRataRataUmur');
  }
};

const getTemukanTuaMuda = async () => {
  try {
    const response = await axios.get(`${API_URL}/statistik/tua-muda`);
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'getTemukanTuaMuda');
  }
};

const getStatistikJenis = async () => {
  try {
    const response = await axios.get(`${API_URL}/statistik/jenis`);
    return response.data;
  } catch (error) {
    handleAxiosError(error, 'getStatistikJenis');
  }
};

const hewanService = {
  getAllHewan,
  tambahHewan,
  updateHewan,
  hapusHewan,
  getRataRataUmur,
  getTemukanTuaMuda,
  getStatistikJenis,
};

export default hewanService;