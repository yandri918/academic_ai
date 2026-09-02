# ============================================
# AcademAI v2.0 — README
# ============================================

# 🎓 AcademAI — AI Scientific Article Generator

> **Stack**: Claude Sonnet 4.5 · n8n · Semantic Scholar · DuckDuckGo · Gotenberg  
> **Version**: 2.0 | **Scope**: Dunia Pendidikan & Akademik

---

## 📁 Struktur Project

```
academ-ai/
├── docker-compose.yml          # Stack: n8n + Gotenberg
├── .env.example                # Template environment variables
├── .env                        # (Dibuat dari .env.example, jangan di-commit!)
├── start.ps1                   # Script setup & run otomatis
├── n8n/
│   └── academ_ai_workflow_v2.json  # Workflow n8n siap import
├── uploads/                    # File yang diupload user
└── exports/                    # Dokumen hasil export
```

---

## 🚀 Cara Menjalankan (3 Langkah)

### Step 1: Install Docker Desktop

Download dan install dari:
👉 https://www.docker.com/products/docker-desktop/

Restart komputer setelah install.

---

### Step 2: Isi API Key

```powershell
# Di folder academ-ai, buka .env.example, salin menjadi .env
Copy-Item .env.example .env
notepad .env
```

Isi nilai berikut di `.env`:

```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXX    # WAJIB
SEMANTIC_SCHOLAR_API_KEY=                   # Opsional (gratis tanpa key)
```

Daftar Anthropic API Key di: https://console.anthropic.com

---

### Step 3: Jalankan

```powershell
# Jalankan script otomatis
.\start.ps1

# Atau manual:
docker-compose up -d
```

---

## 🌐 Akses Dashboard

Setelah container berjalan:

| Service | URL | Auth |
|---------|-----|------|
| n8n Dashboard | http://localhost:5678 | admin / academ2024 |
| Gotenberg | http://localhost:3001 | - |

---

## 📥 Import Workflow ke n8n

1. Buka http://localhost:5678
2. Login: **admin** / **academ2024**
3. Klik menu **≡** → **Workflows** → **Import from file**
4. Pilih: `n8n/academ_ai_workflow_v2.json`
5. Masuk ke node **🤖 Claude Sonnet Model**
6. Klik **+ Add credential** → pilih **Anthropic API**
7. Masukkan API Key Anthropic Anda
8. Klik tombol **Active** (toggle di kanan atas) untuk mengaktifkan workflow
9. Salin Webhook URL yang muncul

---

## 🧪 Test API

### Chat Biasa (Mode Drafting)
```powershell
$body = '{"sessionId":"test_001","mode":"drafting","discipline":"economics","message":"Bantu tulis latar belakang tentang UMKM digital di Banyumas"}'
Invoke-RestMethod -Uri "http://localhost:5678/webhook/academ-ai" -Method POST -Body $body -ContentType "application/json"
```

### Generate Full Dokumen
```powershell
$body = @{
  sessionId = "banyumas_001"
  action = "generate_full"
  mode = "drafting"
  topic = "Pengaruh Aplikasi Digital terhadap UMKM di Tengah Meningkatnya Minimarket Modern: Studi Kasus Kabupaten Banyumas"
  discipline = "economics"
  language = "indonesia"
  options = @{
    journalCount = 15
    yearFilter = "2019-2024"
    runCitationValidator = $true
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5678/webhook/academ-ai" -Method POST -Body $body -ContentType "application/json"
```

### Validate Citations
```powershell
$body = '{"sessionId":"test_001","action":"validate_citations","content":"Menurut Santoso et al. (2023) dan Wijaya (2021) digitalisasi UMKM..."}'
Invoke-RestMethod -Uri "http://localhost:5678/webhook/academ-ai" -Method POST -Body $body -ContentType "application/json"
```

### Mode SLR
```powershell
$body = '{"sessionId":"test_001","mode":"SLR","message":"Buat tabel penelitian terdahulu: digital UMKM Indonesia 2020-2024"}'
Invoke-RestMethod -Uri "http://localhost:5678/webhook/academ-ai" -Method POST -Body $body -ContentType "application/json"
```

---

## ⚙️ Mode Operasi

| Mode | Kegunaan |
|------|----------|
| `drafting` | Tulis konten baru dari nol |
| `editing` | Review & perbaiki tulisan |
| `paraphrasing` | Parafrase untuk hindari plagiat |
| `SLR` | Systematic Literature Review |
| `proposal` | Buat proposal penelitian |
| `abstract` | Abstrak Indonesia + Inggris |
| `statistics` | Interpretasi hasil SPSS/R |

---

## 🛑 Perintah Docker

```powershell
# Jalankan
docker-compose up -d

# Stop
docker-compose down

# Lihat log
docker-compose logs -f n8n

# Restart
docker-compose restart n8n

# Status
docker-compose ps
```

---

## 🆘 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Docker tidak bisa start | Pastikan virtualisasi (Hyper-V/WSL2) aktif di BIOS |
| Port 5678 sudah dipakai | Ganti port di docker-compose.yml |
| API Key tidak valid | Cek kembali di console.anthropic.com |
| Workflow tidak aktif | Klik toggle "Active" di kanan atas n8n |
| Webhook URL tidak muncul | Klik webhook node → salin URL dari modal |

---

*AcademAI v2.0 — Powered by Claude + n8n*
