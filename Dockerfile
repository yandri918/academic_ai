# ============================================
# AcademAI — n8n Railway Deployment
# Image: n8nio/n8n (official)
# ============================================
FROM n8nio/n8n:latest

# Expose n8n port
EXPOSE 5678

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5678/healthz || exit 1
