#!/usr/bin/env bash
# ==============================================================================
# sync-auth.sh - Push local auth files to Render CLIProxyAPI service
# ==============================================================================
#
# Usage:
#   ./sync-auth.sh                     # Encode + update Render env var
#   ./sync-auth.sh --encode-only       # Just print the base64 value (for manual use)
#   ./sync-auth.sh --dry-run           # Show what would be uploaded without doing it
#
# Prerequisites:
#   - Render API key set as RENDER_API_KEY env var (or in ~/.render/api-key)
#   - Render service ID set as RENDER_SERVICE_ID env var (or auto-detected)
#   - Local auth files in ~/.cli-proxy-api/
#
# The script:
#   1. Tar+gzip+base64 encodes all JSON files in ~/.cli-proxy-api/
#   2. Updates the AUTH_FILES_B64 environment variable on Render via API
#   3. Triggers a redeploy so the new auth files take effect
#
# ==============================================================================
set -euo pipefail

# Configuration
AUTH_DIR="${CLI_PROXY_AUTH_DIR:-${HOME}/.cli-proxy-api}"
RENDER_API_BASE="https://api.render.com/v1"
SERVICE_NAME="cliproxyapi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --------------------------------------------------------------------------
# Validate auth directory
# --------------------------------------------------------------------------
if [ ! -d "${AUTH_DIR}" ]; then
    log_error "Auth directory not found: ${AUTH_DIR}"
    log_error "Set CLI_PROXY_AUTH_DIR to override the default path."
    exit 1
fi

JSON_COUNT=$(find "${AUTH_DIR}" -maxdepth 1 -name '*.json' -type f | wc -l | tr -d ' ')
if [ "${JSON_COUNT}" -eq 0 ]; then
    log_error "No JSON files found in ${AUTH_DIR}"
    exit 1
fi

log_info "Found ${JSON_COUNT} auth file(s) in ${AUTH_DIR}"

# --------------------------------------------------------------------------
# Encode auth files as base64 tar.gz
# --------------------------------------------------------------------------
encode_auth_files() {
    # Only include .json files, strip the directory prefix
    tar czf - -C "${AUTH_DIR}" $(ls -1 "${AUTH_DIR}"/*.json 2>/dev/null | xargs -n1 basename) | base64
}

log_info "Encoding auth files..."
AUTH_B64=$(encode_auth_files)
AUTH_SIZE=$(echo "${AUTH_B64}" | wc -c | tr -d ' ')
log_info "Encoded size: ${AUTH_SIZE} bytes"

# Render env var limit check (64KB for individual env vars)
MAX_SIZE=65536
if [ "${AUTH_SIZE}" -gt "${MAX_SIZE}" ]; then
    log_error "Encoded auth files exceed Render's 64KB env var limit (${AUTH_SIZE} bytes)."
    log_error "Consider reducing the number of auth files or using a different storage method."
    exit 1
fi

# --------------------------------------------------------------------------
# Handle --encode-only mode
# --------------------------------------------------------------------------
if [ "${1:-}" = "--encode-only" ]; then
    echo "${AUTH_B64}"
    exit 0
fi

# --------------------------------------------------------------------------
# Handle --dry-run mode
# --------------------------------------------------------------------------
if [ "${1:-}" = "--dry-run" ]; then
    log_info "Dry run mode. Would upload ${AUTH_SIZE} bytes to AUTH_FILES_B64."
    log_info "Auth files that would be included:"
    ls -la "${AUTH_DIR}"/*.json 2>/dev/null | while read -r line; do
        echo "  ${line}"
    done
    exit 0
fi

# --------------------------------------------------------------------------
# Get Render API key
# --------------------------------------------------------------------------
if [ -z "${RENDER_API_KEY:-}" ]; then
    if [ -f "${HOME}/.render/api-key" ]; then
        RENDER_API_KEY=$(cat "${HOME}/.render/api-key")
    else
        log_error "RENDER_API_KEY not set and ~/.render/api-key not found."
        log_error "Get your API key from: https://dashboard.render.com/account/api-keys"
        exit 1
    fi
fi

# --------------------------------------------------------------------------
# Find the Render service ID
# --------------------------------------------------------------------------
if [ -z "${RENDER_SERVICE_ID:-}" ]; then
    log_info "Looking up service '${SERVICE_NAME}' on Render..."
    SERVICES_RESPONSE=$(curl -sS \
        -H "Authorization: Bearer ${RENDER_API_KEY}" \
        -H "Accept: application/json" \
        "${RENDER_API_BASE}/services?name=${SERVICE_NAME}&limit=1")

    RENDER_SERVICE_ID=$(echo "${SERVICES_RESPONSE}" | jq -r '.[0].service.id // empty')

    if [ -z "${RENDER_SERVICE_ID}" ]; then
        log_error "Could not find service '${SERVICE_NAME}' on Render."
        log_error "Set RENDER_SERVICE_ID manually or check the service name."
        log_error "API response: ${SERVICES_RESPONSE}"
        exit 1
    fi
    log_info "Found service ID: ${RENDER_SERVICE_ID}"
fi

# --------------------------------------------------------------------------
# Update the AUTH_FILES_B64 environment variable
# --------------------------------------------------------------------------
log_info "Updating AUTH_FILES_B64 on Render service ${RENDER_SERVICE_ID}..."

UPDATE_RESPONSE=$(curl -sS -w "\n%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg val "${AUTH_B64}" '[{"key": "AUTH_FILES_B64", "value": $val}]')" \
    "${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/env-vars")

HTTP_CODE=$(echo "${UPDATE_RESPONSE}" | tail -1)
RESPONSE_BODY=$(echo "${UPDATE_RESPONSE}" | sed '$d')

if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
    log_info "Environment variable updated successfully (HTTP ${HTTP_CODE})."
else
    log_error "Failed to update environment variable (HTTP ${HTTP_CODE})."
    log_error "Response: ${RESPONSE_BODY}"
    exit 1
fi

# --------------------------------------------------------------------------
# Trigger a redeploy
# --------------------------------------------------------------------------
log_info "Triggering redeploy..."

DEPLOY_RESPONSE=$(curl -sS -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Accept: application/json" \
    "${RENDER_API_BASE}/services/${RENDER_SERVICE_ID}/deploys")

HTTP_CODE=$(echo "${DEPLOY_RESPONSE}" | tail -1)

if [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
    log_info "Redeploy triggered successfully."
    DEPLOY_ID=$(echo "${DEPLOY_RESPONSE}" | sed '$d' | jq -r '.id // empty')
    if [ -n "${DEPLOY_ID}" ]; then
        log_info "Deploy ID: ${DEPLOY_ID}"
        log_info "Monitor at: https://dashboard.render.com/web/${RENDER_SERVICE_ID}/deploys/${DEPLOY_ID}"
    fi
else
    log_warn "Redeploy trigger returned HTTP ${HTTP_CODE}. You may need to redeploy manually."
fi

log_info "Done. Auth files synced to Render."
log_info "The service will restart with the updated auth files."
