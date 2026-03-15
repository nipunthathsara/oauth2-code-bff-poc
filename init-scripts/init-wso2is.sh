#!/bin/sh
# ============================================================
# init-wso2is.sh
# Waits for WSO2 IS to be ready, then creates the OIDC
# application and writes the client_id to /shared-config.
# ============================================================

set -e

WSO2_HOST="https://wso2is:9443"
ADMIN_B64="YWRtaW46YWRtaW4="          # admin:admin
SHARED=/shared-config
APP_NAME="ReactOIDCApp"

log() { echo "[init-wso2is] $*"; }

# ── 1. Wait for WSO2 IS health ──────────────────────────────
log "Waiting for WSO2 IS at $WSO2_HOST ..."
TRIES=0
until curl -sk --max-time 5 \
    "$WSO2_HOST/api/health-check/v1.0/health" \
    -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; do
  TRIES=$((TRIES + 1))
  if [ $TRIES -gt 60 ]; then
    log "ERROR: WSO2 IS did not become healthy after 5 minutes. Aborting."
    exit 1
  fi
  log "Not ready yet (attempt $TRIES/60). Retrying in 5 s..."
  sleep 5
done
log "WSO2 IS is healthy!"

# Extra wait: application management API may not be ready immediately
sleep 10

# ── 2. Check if application already exists ──────────────────
log "Checking if application '$APP_NAME' already exists..."
EXISTING=$(curl -sk \
  "$WSO2_HOST/api/server/v1/applications?filter=name+eq+$APP_NAME" \
  -H "Authorization: Basic $ADMIN_B64" \
  -H "Accept: application/json")

EXISTING_ID=$(echo "$EXISTING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$EXISTING_ID" ]; then
  log "Application already exists with ID: $EXISTING_ID"
  APP_ID="$EXISTING_ID"
else
  # ── 3. Create OIDC application ───────────────────────────
  log "Creating OIDC application '$APP_NAME'..."
  CREATE_RESP=$(curl -sk -X POST \
    "$WSO2_HOST/api/server/v1/applications" \
    -H "Authorization: Basic $ADMIN_B64" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "'"$APP_NAME"'",
      "description": "React SPA with OIDC login",
      "templateId": "custom-application",
      "inboundProtocolConfiguration": {
        "oidc": {
          "grantTypes": ["authorization_code", "refresh_token"],
          "publicClient": true,
          "callbackURLs": [
            "http://localhost/callback",
            "http://localhost"
          ],
          "allowedOrigins": [
            "http://localhost"
          ],
          "pkce": {
            "mandatory": true,
            "supportPlainTransformAlgorithm": false
          },
          "accessToken": {
            "type": "JWT",
            "userAccessTokenExpiryInSeconds": 3600
          },
          "idToken": {
            "expiryInSeconds": 3600,
            "audience": ["ReactOIDCApp"]
          },
          "logout": {
            "postLogoutRedirectURIs": ["http://localhost"]
          }
        }
      },
      "claimConfiguration": {
        "dialect": "LOCAL",
        "claimMappings": [
          {
            "localClaim": {"uri": "http://wso2.org/claims/username"},
            "applicationClaim": "username"
          },
          {
            "localClaim": {"uri": "http://wso2.org/claims/emailaddress"},
            "applicationClaim": "email"
          },
          {
            "localClaim": {"uri": "http://wso2.org/claims/givenname"},
            "applicationClaim": "given_name"
          },
          {
            "localClaim": {"uri": "http://wso2.org/claims/lastname"},
            "applicationClaim": "family_name"
          }
        ],
        "requestedClaims": [
          {
            "claim": {"uri": "http://wso2.org/claims/emailaddress"},
            "mandatory": false
          },
          {
            "claim": {"uri": "http://wso2.org/claims/givenname"},
            "mandatory": false
          },
          {
            "claim": {"uri": "http://wso2.org/claims/lastname"},
            "mandatory": false
          }
        ]
      },
      "authenticationSequence": {
        "type": "DEFAULT"
      }
    }')

  APP_ID=$(echo "$CREATE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$APP_ID" ]; then
    log "ERROR: Failed to create application. Response:"
    echo "$CREATE_RESP"
    exit 1
  fi
  log "Application created with ID: $APP_ID"
fi

# ── 4. Retrieve OIDC client credentials ─────────────────────
log "Fetching OIDC client credentials..."
OIDC_RESP=$(curl -sk \
  "$WSO2_HOST/api/server/v1/applications/$APP_ID/inbound-protocols/oidc" \
  -H "Authorization: Basic $ADMIN_B64" \
  -H "Accept: application/json")

CLIENT_ID=$(echo "$OIDC_RESP" | grep -o '"clientId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  log "ERROR: Could not extract clientId. OIDC response:"
  echo "$OIDC_RESP"
  exit 1
fi

log "Client ID: $CLIENT_ID"

# ── 5. Enable self-registration via REST API ────────────────
log "Enabling self-registration..."
curl -sk -X PATCH \
  "$WSO2_HOST/api/server/v1/identity-governance/User%20Onboarding/connectors/c2VsZi1yZWdpc3RyYXRpb24" \
  -H "Authorization: Basic $ADMIN_B64" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": [
      {"name": "SelfRegistration.Enable", "value": "true"},
      {"name": "SelfRegistration.LockOnCreation", "value": "false"},
      {"name": "SelfRegistration.Notification.InternallyManage", "value": "true"},
      {"name": "SelfRegistration.SendConfirmationOnCreation", "value": "false"}
    ]
  }' -o /dev/null
log "Self-registration configured."

# ── 6. Write config to shared volume ────────────────────────
mkdir -p "$SHARED"
echo -n "$CLIENT_ID" > "$SHARED/client_id"
log "Wrote client_id to $SHARED/client_id"

log "=========================================="
log " Initialization complete!"
log " Application : $APP_NAME"
log " App ID      : $APP_ID"
log " Client ID   : $CLIENT_ID"
log "=========================================="
