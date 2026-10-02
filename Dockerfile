# ============================================
# AcademAI — Production Dockerfile for Railway
# Runs the unified Academic AI Engine & Web Interface
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy dependencies definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy all application code
COPY . .

# Ensure storage directories exist
RUN mkdir -p /app/data /app/exports /app/uploads

# Expose server port (Railway dynamically injects PORT)
ENV PORT=3000
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/healthz || exit 1

CMD ["node", "server.js"]
