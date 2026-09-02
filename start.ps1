# ============================================
# AcademAI v2.0 — Setup & Run Script (Windows)
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AcademAI v2.0 — Local Setup Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check .env
if (-not (Test-Path ".env")) {
    Write-Host "[1/4] Membuat file .env dari template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "      ✅ .env dibuat. PENTING: Edit .env dan isi ANTHROPIC_API_KEY!" -ForegroundColor Green
    Write-Host "      📝 Buka: notepad .env" -ForegroundColor Yellow
    notepad .env
    Write-Host ""
    Write-Host "Setelah mengisi API key, jalankan script ini lagi." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "[1/4] ✅ File .env sudah ada" -ForegroundColor Green
}

# Step 2: Check API key
$envContent = Get-Content ".env" | Where-Object { $_ -match "ANTHROPIC_API_KEY=" }
if ($envContent -match "GANTI_DENGAN" -or $envContent -match "=$") {
    Write-Host ""
    Write-Host "⚠️  ANTHROPIC_API_KEY belum diisi di .env!" -ForegroundColor Red
    Write-Host "   Daftar di: https://console.anthropic.com" -ForegroundColor Yellow
    Write-Host "   Lalu edit .env dan isi: ANTHROPIC_API_KEY=sk-ant-..." -ForegroundColor Yellow
    exit 1
}
Write-Host "[2/4] ✅ API Key terdeteksi" -ForegroundColor Green

# Step 3: Check Docker
Write-Host "[3/4] Memeriksa Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "      ✅ Docker tersedia" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Docker tidak ditemukan!" -ForegroundColor Red
    Write-Host "      Unduh Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "      Setelah install, restart komputer dan jalankan script ini lagi." -ForegroundColor Yellow
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

# Step 4: Run Docker Compose
Write-Host "[4/4] Menjalankan AcademAI..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ AcademAI berhasil dijalankan!     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 n8n Dashboard : http://localhost:5678" -ForegroundColor Cyan
Write-Host "   Username      : admin" -ForegroundColor White
Write-Host "   Password      : academ2024" -ForegroundColor White
Write-Host ""
Write-Host "📋 LANGKAH BERIKUTNYA:" -ForegroundColor Yellow
Write-Host "   1. Buka http://localhost:5678" -ForegroundColor White
Write-Host "   2. Login dengan admin / academ2024" -ForegroundColor White
Write-Host "   3. Klik 'Import workflow'" -ForegroundColor White
Write-Host "   4. Pilih file: n8n\academ_ai_workflow_v2.json" -ForegroundColor White
Write-Host "   5. Isi Anthropic credential di n8n" -ForegroundColor White
Write-Host "   6. Aktifkan workflow & salin webhook URL" -ForegroundColor White
Write-Host ""
Write-Host "🧪 TEST dengan curl:" -ForegroundColor Yellow
Write-Host '   curl -X POST http://localhost:5678/webhook/academ-ai \' -ForegroundColor Gray
Write-Host '     -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '     -d "{\"sessionId\":\"test\",\"mode\":\"drafting\",\"message\":\"Halo AcademAI\"}"' -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Untuk stop: docker-compose down" -ForegroundColor Red
