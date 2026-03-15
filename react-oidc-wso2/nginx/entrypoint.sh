#!/bin/sh
# ============================================================
# entrypoint.sh
# Reads the WSO2 IS client_id from the shared volume and
# writes /usr/share/nginx/html/env-config.js so that the
# React app can pick it up at runtime via window._env_.
# ============================================================

set -e

SHARED=/shared-config
HTML=/usr/share/nginx/html

echo "[entrypoint] Reading WSO2 IS client configuration..."

# Read client_id (written by init-wso2is container)
if [ -f "$SHARED/client_id" ]; then
  CLIENT_ID=$(cat "$SHARED/client_id")
  echo "[entrypoint] Client ID found: $CLIENT_ID"
else
  echo "[entrypoint] WARNING: $SHARED/client_id not found. Using fallback."
  CLIENT_ID="MISSING_CLIENT_ID"
fi

WSO2_BASE_URL="${WSO2_BASE_URL:-https://localhost:9443}"

# Write env-config.js that the browser will load via <script src="/env-config.js">
cat > "$HTML/env-config.js" <<EOF
// Auto-generated at container startup — do not edit
window._env_ = {
  "CLIENT_ID": "${CLIENT_ID}",
  "WSO2_BASE_URL": "${WSO2_BASE_URL}"
};
EOF

echo "[entrypoint] env-config.js written:"
cat "$HTML/env-config.js"
echo ""
echo "[entrypoint] Starting nginx..."
exec nginx -g 'daemon off;'
