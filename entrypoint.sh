#!/bin/sh
set -e

# Fix permissions on mounted volume if present
if [ -d "/home/node/.n8n" ]; then
    chown -R 1000:1000 /home/node/.n8n 2>/dev/null || true
    chmod -R 775 /home/node/.n8n 2>/dev/null || true
fi

if command -v su-exec > /dev/null; then
    exec su-exec node /docker-entrypoint.sh "$@"
elif command -v gosu > /dev/null; then
    exec gosu node /docker-entrypoint.sh "$@"
else
    exec su node -s /bin/sh -c "/docker-entrypoint.sh $*"
fi
