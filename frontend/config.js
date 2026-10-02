/* ============================================
   AcademAI — Frontend Configuration
   ============================================
   EDIT FILE INI setelah deploy n8n ke Railway:
   1. Ganti N8N_RAILWAY_URL dengan URL dari Railway dashboard
   2. Simpan file
   3. Refresh browser
   ============================================ */

window.ACADEM_CONFIG = {
  // ── WAJIB DIISI ──────────────────────────────
  N8N_URL: "https://academicai-production-a41d.up.railway.app",

  // Path webhook
  WEBHOOK_PATH: "/webhook/academ-ai",

  // Timeout request AI dalam milidetik (default 2 menit)
  REQUEST_TIMEOUT_MS: 120000,

  // Interval cek koneksi n8n dalam milidetik (default 15 detik)
  PING_INTERVAL_MS: 15000,
};
