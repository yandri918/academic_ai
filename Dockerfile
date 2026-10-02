# ============================================
# AcademAI — n8n Railway Deployment
# Image: n8nio/n8n (official)
# ============================================
FROM n8nio/n8n:latest

USER root

# Install su-exec or gosu for privilege dropping
RUN if command -v apk > /dev/null; then \
        apk add --no-cache su-exec; \
    elif command -v apt-get > /dev/null; then \
        apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*; \
    fi

# Setup entrypoint script to fix volume permissions on Railway
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


# Expose n8n port
EXPOSE 5678

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5678/healthz || exit 1

ENTRYPOINT ["/entrypoint.sh"]

