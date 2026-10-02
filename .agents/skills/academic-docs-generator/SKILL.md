---
name: academic-docs-generator
description: >-
  Generates and formats Indonesian academic thesis documents, research proposals, journal articles (SINTA),
  and converts markdown drafts into professional Microsoft Word (.docx) documents following standard university
  guidelines (Times New Roman 12pt, 1.5 line spacing, 4-3-3-3 / 4-4-3-3 cm margins, structured headings,
  formal academic tables, and APA 7th Edition citations).
---

# Academic Docs Generator — Pedoman Standar Penyusunan & Format Dokumen

Skill ini memandu proses penulisan, penataan struktur, dan pembuatan dokumen akademik formal (Skripsi, Tesis, Proposal Penelitian Tindakan Kelas / Eksperimen, dan Artikel Jurnal SINTA) yang siap cetak dan siap uji sidang.

---

## 1. Standar Tipografi & Tata Letak Dokumen (Pedoman Kampus Indonesia)

Format fisik naskah skripsi/artikel ilmiah wajib mengikuti standar baku:
* **Ukuran Kertas**: A4 (210 x 297 mm) 80 gram.
* **Margin Halaman**:
  * Margin Kiri (*Left*): 4 cm (ruang jilid skripsi)
  * Margin Atas (*Top*): 3 cm atau 4 cm
  * Margin Kanan (*Right*): 3 cm
  * Margin Bawah (*Bottom*): 3 cm
* **Jenis Font**: Times New Roman (atau Arial pada beberapa panduan kampus).
* **Ukuran Font**:
  * Judul Skripsi / Bab: 14pt (Bold, Huruf Kapital, Rata Tengah)
  * Sub-bab: 12pt (Bold, Title Case, Rata Kiri)
  * Batang Tubuh Teks: 12pt (Reguler, Rata Kiri-Kanan / *Justify*)
  * Judul Tabel & Gambar: 10pt–11pt (Bold)
  * Catatan Kaki / Sumber: 10pt (Italic)
* **Spasi Baris**:
  * Batang tubuh teks: 1,5 spasi atau 2,0 spasi (ganda).
  * Abstrak, kutipan langsung > 4 baris, dan judul tabel/daftar pustaka: 1,0 spasi (tunggal).
* **Indentasi Paragraf**: Baris pertama setiap paragraf menjorok ke dalam 1 cm atau 1 tab (5-7 ketukan).

---

## 2. Sistematika Standar Dokumen Skripsi S1

### A. Bagian Awal
1. Halaman Sampul Depan / Cover (*Hard Cover*)
2. Halaman Judul Dalam
3. Halaman Persetujuan Pembimbing
4. Halaman Pengesahan Penguji Sidang
5. Halaman Pernyataan Keaslian Naskah (Bebas Plagiat bermeterai Rp10.000)
6. Halaman Abstrak Dwibahasa:
   - **Abstrak (Bahasa Indonesia)**: 150–200 kata, 1 spasi, 1 paragraf (Latar Belakang, Tujuan, Metode, Temuan Utama, Simpulan) + 3–5 Kata Kunci.
   - **Abstract (English)**: 150–200 kata, 1 spasi, cetak miring (*italic*) + 3–5 Keywords.
7. Kata Pengantar
8. Daftar Isi, Daftar Tabel, Daftar Gambar, Daftar Lampiran

### B. Bagian Utama (Batang Tubuh)
* **BAB I: PENDAHULUAN**
  * 1.1 Latar Belakang Masalah (Alur Piramida Terbalik: Makro -> Meso -> Mikro -> *Das Sollen* vs *Das Sein* -> *Research Gap* -> Urgensi Solusi)
  * 1.2 Identifikasi Masalah
  * 1.3 Pembatasan Masalah
  * 1.4 Rumusan Masalah (Pertanyaan operasional terukur)
  * 1.5 Tujuan Penelitian (Sinkron dengan rumusan masalah)
  * 1.6 Manfaat Penelitian (Teoretis dan Praktis)
* **BAB II: KAJIAN PUSTAKA, KERANGKA BERPIKIR, DAN HIPOTESIS**
  * 2.1 Kajian Teori Variabel X dan Variabel Y (Teori Perkembangan Piaget, Vygotsky ZPD, Montessori, Ki Hajar Dewantara, STPPA)
  * 2.2 Penelitian Terdahulu yang Relevan (Tabel Matriks Komparasi 5–8 Penelitian)
  * 2.3 Kerangka Berpikir (Bagan alur logis Pra-tindakan -> Intervensi -> Hasil Akhir)
  * 2.4 Hipotesis Tindakan / Penelitian
* **BAB III: METODOLOGI PENELITIAN**
  * 3.1 Pendekatan dan Desain Penelitian (PTK 2 Siklus Kemmis & McTaggart atau Kuasi Eksperimen)
  * 3.2 Tempat, Subjek, dan Waktu Penelitian (Kelompok A 4-5 th / B 5-6 th)
  * 3.3 Variabel Penelitian dan Definisi Operasional
  * 3.4 Teknik dan Instrumen Pengumpulan Data (Observasi, Wawancara, Dokumentasi, Rubrik BB-MB-BSH-BSB)
  * 3.5 Uji Validitas & Reliabilitas Instrumen
  * 3.6 Teknik Analisis Data & Indikator Keberhasilan Klasikal ($P \ge 75-80\%$)
* **BAB IV: HASIL PENELITIAN DAN PEMBAHASAN**
  * 4.1 Deskripsi Kondisi Awal (Pra-Siklus)
  * 4.2 Pelaksanaan Tindakan Siklus I dan Siklus II (Perencanaan, Tindakan, Observasi, Refleksi)
  * 4.3 Peningkatan Antarsiklus dan Uji Ketuntasan
  * 4.4 Pembahasan Temuan Ilmiah (Mengaitkan data lapangan dengan teori)
* **BAB V: KESIMPULAN DAN SARAN**
  * 5.1 Kesimpulan
  * 5.2 Saran (Bagi Guru, Satuan Lembaga, Orang Tua, dan Peneliti Lanjutan)

### C. Bagian Akhir
* **DAFTAR PUSTAKA** (Gaya APA 7th Edition alfabetis tanpa nomor urut).
* **LAMPIRAN** (RPPH / Modul Ajar, Lembar Observasi, Foto Kegiatan, Surat Izin Riset).

---

## 3. Protokol Pembuatan Dokumen Word (.docx) Otomatis

Gunakan generator `docx` di backend (`POST /api/export/docx`) untuk mengubah draf Markdown menjadi dokumen Word terformat:
1. Konversi `# Heading 1` menjadi BAB I, BAB II (14pt Bold, Centered).
2. Konversi `## Heading 2` & `### Heading 3` menjadi Sub-bab numerik (12pt Bold).
3. Bungkus paragraf teks dengan font Times New Roman 12pt, indentasi 1 cm, spasi 1.5.
4. Render tabel Markdown menjadi Tabel Word dengan garis tepi formal (*grid border*), latar header abu-abu halus (*shading* `#F1F5F9`), dan teks 11pt.
5. Konversi sitasi dan daftar pustaka dengan indentasi gantung (*hanging indent* 1,27 cm).
