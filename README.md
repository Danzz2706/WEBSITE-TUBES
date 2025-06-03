# Pendataan Hewan Web (Frontend React)

Ini adalah bagian frontend dari aplikasi Pendataan Hewan yang dibangun menggunakan React JS. Aplikasi ini bertujuan untuk menyediakan antarmuka pengguna yang interaktif untuk mengelola data hewan peliharaan.

**Aplikasi yang Sudah Di-hosting:**

Anda dapat mengakses versi live dari aplikasi frontend ini di:
[https://website-tubes-git-main-danzz2706s-projects.vercel.app/](https://website-tubes-git-main-danzz2706s-projects.vercel.app/) 
**(Catatan: Ganti dengan URL produksi Vercel Anda yang sebenarnya jika berbeda)**

## Fitur Utama (Frontend)

* Menampilkan Daftar Hewan: Menampilkan semua data hewan yang tersimpan.
* Tambah Data Hewan: Menyediakan form untuk menambahkan data hewan baru.
* Edit Data Hewan: Memungkinkan pengguna untuk mengubah data hewan yang sudah ada.
* Hapus Data Hewan: Memungkinkan pengguna untuk menghapus data hewan.
* Pencarian Data Hewan: Mencari hewan berdasarkan nama.
* Pengurutan Data Hewan: Mengurutkan data hewan berdasarkan berbagai kriteria (ID, Nama, Jenis, Umur, Pemilik).
* Menampilkan Statistik: Menampilkan statistik dasar seperti rata-rata umur, hewan tertua & termuda, dan jumlah per jenis hewan.

## Teknologi yang Digunakan

* [React JS](https://reactjs.org/) - Library JavaScript untuk membangun antarmuka pengguna.
* [Axios](https://axios-http.com/) - (Jika digunakan) HTTP client berbasis Promise untuk melakukan permintaan ke API backend.
* CSS (atau framework CSS pilihan Anda seperti Tailwind CSS, Material-UI, dll.)
* Di-hosting di [Vercel](https://vercel.com/)

## Prasyarat

* Node.js (versi 16.x atau lebih baru direkomendasikan)
* npm (Node Package Manager) atau yarn

## Instalasi dan Menjalankan Proyek (Pengembangan Lokal)

1.  **Clone repositori ini (jika belum):**
    ```bash
    git clone [https://github.com/Danzz2706/WEBSITE-TUBES.git](https://github.com/Danzz2706/WEBSITE-TUBES.git)
    cd WEBSITE-TUBES # atau nama folder proyek frontend Anda
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    atau jika menggunakan yarn:
    ```bash
    yarn install
    ```

3.  **Konfigurasi URL API Backend:**
    * Buat file `.env` di root direktori proyek.
    * Tambahkan variabel lingkungan berikut dan sesuaikan dengan URL backend Go Anda yang sedang berjalan (untuk pengembangan lokal) atau URL backend yang sudah di-deploy (untuk versi produksi):
        ```env
        REACT_APP_API_URL=http://localhost:8080/api # Untuk pengembangan lokal
        # REACT_APP_API_URL=[https://url-backend-go-anda.com/api](https://url-backend-go-anda.com/api) # Untuk produksi
        ```
    * Pastikan server backend Go Anda sudah berjalan (untuk pengembangan lokal) atau sudah di-deploy dan dapat diakses (untuk produksi).

4.  **Jalankan aplikasi React:**
    ```bash
    npm start
    ```
    atau jika menggunakan yarn:
    ```bash
    yarn start
    ```
    Aplikasi akan terbuka secara otomatis di browser Anda pada alamat `http://localhost:3000`.

## Proses Build untuk Produksi

Untuk membuat build aplikasi yang siap di-deploy:
```bash
npm run build
