// main.go (Backend Go - Semua Data Ditampilkan ke Klien, Statistik Terupdate)
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sort"
	"strconv" // Untuk konversi string ke integer saat parsing ID
	"strings"
	"sync"
)

// ---- DEKLARASI GLOBAL ----
type Hewan struct {
	ID      string `json:"id"`
	Jenis   string `json:"jenis"`
	Nama    string `json:"nama"`
	Umur    int    `json:"umur"`
	Pemilik string `json:"pemilik"`
}

const maxTotalHewan = 100             // Kapasitas total untuk semua hewan (dummy + klien)
var dataHewan [maxTotalHewan]Hewan // Array utama untuk semua data hewan
var jumlahData int                 // Jumlah total data hewan saat ini

var idCounters = make(map[string]int)
var idCountersMutex = &sync.Mutex{}

// ---- AKHIR DEKLARASI GLOBAL ----

// ---- Middleware CORS ----
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("CORS Middleware: Menerima request dari %s, Method: %s, Path: %s", r.RemoteAddr, r.Method, r.URL.Path)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---- Fungsi Helper untuk Respons ----
func respondWithError(w http.ResponseWriter, code int, message string) {
	log.Printf("SERVER ERROR: Code=%d, Message=%s", code, message)
	respondWithJSON(w, code, map[string]string{"error": message})
}
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling JSON: %v. Payload: %+v", err, payload)
		http.Error(w, `{"error":"Error internal server"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// ---- Fungsi Helper untuk Sorting ----
func urutkanUmurInternal(data []Hewan, order string) {
	n := len(data)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			swap := false
			if order == "desc" {
				if data[j].Umur < data[j+1].Umur { swap = true }
			} else { // default asc
				if data[j].Umur > data[j+1].Umur { swap = true }
			}
			if swap { data[j], data[j+1] = data[j+1], data[j] }
		}
	}
}
func urutkanPemilikInternal(data []Hewan, order string) {
	n := len(data)
	for i := 1; i < n; i++ {
		key := data[i]
		j := i - 1
		if order == "desc" {
			for j >= 0 && data[j].Pemilik < key.Pemilik { data[j+1] = data[j]; j-- }
		} else { // default asc
			for j >= 0 && data[j].Pemilik > key.Pemilik { data[j+1] = data[j]; j-- }
		}
		data[j+1] = key
	}
}

// ---- Fungsi untuk Generate ID Otomatis ----
func generateNewID(jenis string) string {
	idCountersMutex.Lock()
	defer idCountersMutex.Unlock()

	prefix := "X"
	if len(jenis) > 0 {
		cleanedJenis := strings.TrimSpace(jenis)
		if len(cleanedJenis) > 0 {
			prefix = strings.ToUpper(string(cleanedJenis[0]))
		}
	}
	currentCount := idCounters[prefix]
	currentCount++
	idCounters[prefix] = currentCount
	return fmt.Sprintf("%s%02d", prefix, currentCount)
}

// ---- HTTP Handlers ----

func handleSemuaHewan(w http.ResponseWriter, r *http.Request) {
	log.Printf("handleSemuaHewan: Menerima request Method: %s, Path: %s, Query: %s", r.Method, r.URL.Path, r.URL.RawQuery)
	switch r.Method {
	case http.MethodGet:
		namaQuery := strings.ToLower(r.URL.Query().Get("nama"))
		jenisQuery := strings.ToLower(r.URL.Query().Get("jenis"))
		pemilikQuery := strings.ToLower(r.URL.Query().Get("pemilik"))
		sortBy := r.URL.Query().Get("sortBy")
		order := strings.ToLower(r.URL.Query().Get("order"))
		if order != "asc" && order != "desc" { order = "asc" }

		var resultData []Hewan
		if jumlahData > 0 {
			tempData := make([]Hewan, jumlahData)
			copy(tempData, dataHewan[:jumlahData])

			for _, h := range tempData {
				matchNama := namaQuery == "" || strings.Contains(strings.ToLower(h.Nama), namaQuery)
				matchJenis := jenisQuery == "" || strings.Contains(strings.ToLower(h.Jenis), jenisQuery)
				matchPemilik := pemilikQuery == "" || strings.Contains(strings.ToLower(h.Pemilik), pemilikQuery)
				if matchNama && matchJenis && matchPemilik {
					resultData = append(resultData, h)
				}
			}
		} else {
			resultData = []Hewan{}
		}

		if sortBy == "umur" {
			urutkanUmurInternal(resultData, order)
		} else if sortBy == "pemilik" {
			urutkanPemilikInternal(resultData, order)
		} else if sortBy != "" {
			sort.SliceStable(resultData, func(i, j int) bool {
				var less bool
				switch sortBy {
				case "nama": less = resultData[i].Nama < resultData[j].Nama
				case "jenis": less = resultData[i].Jenis < resultData[j].Jenis
				case "id": less = resultData[i].ID < resultData[j].ID
				default: return false
				}
				if order == "desc" { return !less }
				return less
			})
		}
		log.Printf("handleSemuaHewan (GET): Mengirim %d data hewan setelah filter/sort", len(resultData))
		respondWithJSON(w, http.StatusOK, resultData)

	case http.MethodPost:
		log.Println("handleSemuaHewan (POST): Memproses penambahan hewan baru...")
		var hInput struct {
			Jenis   string `json:"jenis"`
			Nama    string `json:"nama"`
			Umur    int    `json:"umur"`
			Pemilik string `json:"pemilik"`
		}
		bodyBytes, errRead := ioutil.ReadAll(r.Body);
		if errRead != nil {
			respondWithError(w, http.StatusInternalServerError, "Gagal membaca request body: "+errRead.Error())
			return
		}
		r.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

		if err := json.NewDecoder(r.Body).Decode(&hInput); err != nil {
			errMsg := fmt.Sprintf("Request body tidak valid: %v. Body: %s", err, string(bodyBytes))
			respondWithError(w, http.StatusBadRequest, errMsg); return
		}
		log.Printf("handleSemuaHewan (POST): Data input (tanpa ID server): %+v", hInput)

		if hInput.Jenis == "" || hInput.Nama == "" || hInput.Pemilik == "" || hInput.Umur < 0 {
			respondWithError(w, http.StatusBadRequest, "Input tidak valid (Jenis, Nama, Pemilik wajib; Umur >= 0)")
			return
		}
		if jumlahData >= maxTotalHewan {
			respondWithError(w, http.StatusConflict, "Kapasitas penyimpanan data di server penuh.")
			return
		}

		newGeneratedID := generateNewID(hInput.Jenis)
		for i := 0; i < jumlahData; i++ {
			if dataHewan[i].ID == newGeneratedID {
				errMsg := fmt.Sprintf("Terjadi konflik ID internal (%s), coba lagi.", newGeneratedID)
				log.Println(errMsg)
				respondWithError(w, http.StatusInternalServerError, errMsg)
				return
			}
		}

		hewanBaru := Hewan{
			ID:      newGeneratedID,
			Jenis:   hInput.Jenis,
			Nama:    hInput.Nama,
			Umur:    hInput.Umur,
			Pemilik: hInput.Pemilik,
		}
		dataHewan[jumlahData] = hewanBaru
		jumlahData++
		log.Printf("handleSemuaHewan (POST): Hewan berhasil ditambahkan: %+v. Jumlah data sekarang: %d", hewanBaru, jumlahData)
		respondWithJSON(w, http.StatusCreated, hewanBaru)

	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Metode "+r.Method+" tidak diizinkan")
	}
}

func handleHewanByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/hewan/")
	log.Printf("handleHewanByID: Menerima request Method: %s, Path: %s, Ekstrak ID: %s", r.Method, r.URL.Path, id)

	if id == r.URL.Path || id == "" {
		respondWithError(w, http.StatusBadRequest, "Format ID hewan di URL tidak benar.")
		return
	}

	idx := -1
	for i := 0; i < jumlahData; i++ {
		if dataHewan[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		respondWithError(w, http.StatusNotFound, "Data hewan dengan ID '"+id+"' tidak ditemukan.")
		return
	}
	log.Printf("handleHewanByID: Hewan ID '%s' ditemukan di index %d", id, idx)

	switch r.Method {
	case http.MethodGet:
		respondWithJSON(w, http.StatusOK, dataHewan[idx])
	case http.MethodPut:
		var hUpdateInput struct {
			Jenis   string `json:"jenis"`
			Nama    string `json:"nama"`
			Umur    int    `json:"umur"`
			Pemilik string `json:"pemilik"`
		}
		bodyBytes, _ := ioutil.ReadAll(r.Body); r.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
		if err := json.NewDecoder(r.Body).Decode(&hUpdateInput); err != nil {
			errMsg := fmt.Sprintf("Request body tidak valid untuk update: %v. Body: %s", err, string(bodyBytes))
			respondWithError(w, http.StatusBadRequest, errMsg); return
		}
		log.Printf("handleHewanByID (PUT): Data update: %+v", hUpdateInput)

		if hUpdateInput.Jenis == "" || hUpdateInput.Nama == "" || hUpdateInput.Pemilik == "" || hUpdateInput.Umur < 0 {
			respondWithError(w, http.StatusBadRequest, "Input update tidak valid.")
			return
		}
		dataHewan[idx].Jenis = hUpdateInput.Jenis
		dataHewan[idx].Nama = hUpdateInput.Nama
		dataHewan[idx].Umur = hUpdateInput.Umur
		dataHewan[idx].Pemilik = hUpdateInput.Pemilik
		log.Printf("handleHewanByID (PUT): Hewan berhasil diupdate: %+v", dataHewan[idx])
		respondWithJSON(w, http.StatusOK, dataHewan[idx])

	case http.MethodDelete:
		hewanDihapus := dataHewan[idx]
		for i := idx; i < jumlahData-1; i++ { dataHewan[i] = dataHewan[i+1] }
		dataHewan[jumlahData-1] = Hewan{}
		jumlahData--
		log.Printf("handleHewanByID (DELETE): Hewan ID '%s' dihapus: %+v. Jumlah data: %d", id, hewanDihapus, jumlahData)
		respondWithJSON(w, http.StatusOK, map[string]string{"message": "Data hewan berhasil dihapus"})
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Metode tidak diizinkan")
	}
}

// ---- Handler Statistik (beroperasi pada semua dataHewan dan jumlahData global) ----
func handleRataRataUmur(w http.ResponseWriter, r *http.Request) {
	log.Printf("handleRataRataUmur: Menerima request Method: %s", r.Method)
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Metode tidak diizinkan")
		return
	}
	if jumlahData == 0 {
		log.Println("handleRataRataUmur: Tidak ada data, mengirim rata-rata 0")
		respondWithJSON(w, http.StatusOK, map[string]float64{"rataRataUmur": 0.0})
		return
	}
	total := 0
	for i := 0; i < jumlahData; i++ { // Gunakan jumlahData global
		total += dataHewan[i].Umur   // Ambil dari dataHewan global
	}
	rata := float64(total) / float64(jumlahData)
	log.Printf("handleRataRataUmur: Menghitung rata-rata dari %d hewan. Total umur: %d, Rata-rata: %.2f", jumlahData, total, rata)
	respondWithJSON(w, http.StatusOK, map[string]float64{"rataRataUmur": rata})
}

func handleTemukanTuaMuda(w http.ResponseWriter, r *http.Request) {
	log.Printf("handleTemukanTuaMuda: Menerima request Method: %s", r.Method)
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Metode tidak diizinkan")
		return
	}
	if jumlahData == 0 {
		log.Println("handleTemukanTuaMuda: Tidak ada data, mengirim null")
		respondWithJSON(w, http.StatusOK, map[string]*Hewan{"tertua": nil, "termuda": nil})
		return
	}
	tertua := dataHewan[0]  // Gunakan dataHewan global
	termuda := dataHewan[0] // Gunakan dataHewan global
	for i := 1; i < jumlahData; i++ { // Gunakan jumlahData global
		if dataHewan[i].Umur > tertua.Umur {
			tertua = dataHewan[i]
		}
		if dataHewan[i].Umur < termuda.Umur {
			termuda = dataHewan[i]
		}
	}
	result := map[string]Hewan{"tertua": tertua, "termuda": termuda}
	log.Printf("handleTemukanTuaMuda: Menghitung dari %d hewan. Tertua: %+v, Termuda: %+v", jumlahData, tertua, termuda)
	respondWithJSON(w, http.StatusOK, result)
}

func handleStatistikJenis(w http.ResponseWriter, r *http.Request) {
	log.Printf("handleStatistikJenis: Menerima request Method: %s", r.Method)
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Metode tidak diizinkan")
		return
	}
	jenisMap := make(map[string]int)
	if jumlahData > 0 { // Gunakan jumlahData global
		for i := 0; i < jumlahData; i++ { // Gunakan dataHewan global
			jenisMap[dataHewan[i].Jenis]++
		}
	}
	log.Printf("handleStatistikJenis: Menghitung dari %d hewan. Hasil map: %+v", jumlahData, jenisMap)
	respondWithJSON(w, http.StatusOK, jenisMap)
}

// ---- Fungsi Main ----
func main() {
	log.Println("Memulai server pendataan hewan (Semua data ditampilkan)...")

	initialDummyData := []Hewan{
		{ID: "K001", Jenis: "Kucing", Nama: "Mochi", Umur: 2, Pemilik: "Lia"},
		{ID: "A001", Jenis: "Anjing", Nama: "Bruno", Umur: 3, Pemilik: "Rudi"},
		{ID: "B001", Jenis: "Burung", Nama: "Kiko", Umur: 1, Pemilik: "Sari"},
		{ID: "I001", Jenis: "Ikan", Nama: "Nemo", Umur: 1, Pemilik: "Dika"},
		{ID: "H001", Jenis: "Hamster", Nama: "Piko", Umur: 1, Pemilik: "Joko"},
		{ID: "K002", Jenis: "Kucing", Nama: "Oyen", Umur: 5, Pemilik: "Lina"},
		{ID: "A002", Jenis: "Anjing", Nama: "Max", Umur: 4, Pemilik: "Putra"},
		{ID: "R001", Jenis: "Kelinci", Nama: "Cici", Umur: 2, Pemilik: "Dewi"},
		{ID: "K003", Jenis: "Kucing", Nama: "Snowy", Umur: 3, Pemilik: "Agus"},
		{ID: "U001", Jenis: "Ular", Nama: "Siska", Umur: 2, Pemilik: "Bambang"},
		{ID: "A003", Jenis: "Anjing", Nama: "Bella", Umur: 1, Pemilik: "Candra"},
		{ID: "B002", Jenis: "Burung", Nama: "Zazu", Umur: 3, Pemilik: "Eka"},
		{ID: "I002", Jenis: "Ikan", Nama: "Dori", Umur: 2, Pemilik: "Fani"},
		{ID: "K004", Jenis: "Kucing", Nama: "Garfield", Umur: 6, Pemilik: "Gilang"},
		{ID: "H002", Jenis: "Hamster", Nama: "Momo", Umur: 1, Pemilik: "Hani"},
		{ID: "A004", Jenis: "Anjing", Nama: "Rex", Umur: 2, Pemilik: "Indra"},
		{ID: "R002", Jenis: "Kelinci", Nama: "Bugs", Umur: 3, Pemilik: "Kartika"},
		{ID: "K005", Jenis: "Kucing", Nama: "Luna", Umur: 1, Pemilik: "Mega"},
		{ID: "T001", Jenis: "Kura-kura", Nama: "Donatello", Umur: 10, Pemilik: "Nina"},
		{ID: "A005", Jenis: "Anjing", Nama: "Cooper", Umur: 5, Pemilik: "Oscar"},
	}

	if len(initialDummyData) <= maxTotalHewan {
		idCountersMutex.Lock()
		for _, hewan := range initialDummyData {
			dataHewan[jumlahData] = hewan
			jumlahData++
			if len(hewan.Jenis) > 0 {
				prefix := strings.ToUpper(string(hewan.Jenis[0]))
				if len(hewan.ID) > 1 {
					nomorStr := hewan.ID[1:]
					nomor, err := strconv.Atoi(nomorStr)
					if err == nil {
						if nomor > idCounters[prefix] {
							idCounters[prefix] = nomor
						}
					} else {
						log.Printf("Peringatan: Gagal parse nomor dari ID dummy '%s' untuk prefix '%s': %v", hewan.ID, prefix, err)
					}
				}
			}
		}
		idCountersMutex.Unlock()
		log.Printf("%d data dummy berhasil diinisialisasi ke dataHewan.", len(initialDummyData))
	} else {
		log.Printf("PERINGATAN: Jumlah data dummy (%d) melebihi maxTotalHewan (%d).", len(initialDummyData), maxTotalHewan)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/hewan", handleSemuaHewan)
	mux.HandleFunc("/api/hewan/", handleHewanByID)
	mux.HandleFunc("/api/hewan/statistik/rata-umur", handleRataRataUmur)
	mux.HandleFunc("/api/hewan/statistik/tua-muda", handleTemukanTuaMuda)
	mux.HandleFunc("/api/hewan/statistik/jenis", handleStatistikJenis)

	port := "8080"
	log.Printf("Server Go siap dan berjalan di http://localhost:%s", port)
	log.Println("Tekan CTRL+C untuk menghentikan server.")
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("KRITIS: Gagal menjalankan server: %v", err)
	}
}