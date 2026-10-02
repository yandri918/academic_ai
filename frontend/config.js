/* ============================================
   AcademAI — Frontend Configuration
   ============================================
   EDIT FILE INI setelah deploy n8n ke Railway:
   1. Ganti N8N_RAILWAY_URL dengan URL dari Railway dashboard
   2. Simpan file
   3. Refresh browser
   ============================================ */

window.ACADEM_CONFIG = {
  // URL server AcademAI (otomatis sesuai host / port yang sedang dibuka)
  N8N_URL: (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : "http://localhost:3000",

  // Path webhook
  WEBHOOK_PATH: "/webhook/academ-ai",

  // Timeout request AI dalam milidetik (default 2 menit)
  REQUEST_TIMEOUT_MS: 120000,

  // Interval cek koneksi n8n dalam milidetik (default 15 detik)
  PING_INTERVAL_MS: 15000,
};
