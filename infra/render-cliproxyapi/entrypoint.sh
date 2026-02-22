#!/bin/sh
set -e

# ==============================================================================
# CLIProxyAPI Render Entrypoint
# ==============================================================================
# Handles:
#   1. Dynamic port binding via $PORT (Render requirement)
#   2. Auth file restoration from $AUTH_FILES_B64 environment variable
#   3. Config generation from template + environment
#   4. Graceful startup of the Go binary
# ==============================================================================

echo "[entrypoint] Starting CLIProxyAPI setup..."

# --------------------------------------------------------------------------
# 1. Restore auth files from base64-encoded tar archive
# --------------------------------------------------------------------------
AUTH_DIR="/root/.cli-proxy-api"
mkdir -p "${AUTH_DIR}"

if [ -n "${AUTH_FILES_B64}" ]; then
    echo "[entrypoint] Decoding auth files from AUTH_FILES_B64..."
    echo "${AUTH_FILES_B64}" | base64 -d | tar xz -C "${AUTH_DIR}" 2>/dev/null
    FILE_COUNT=$(ls -1 "${AUTH_DIR}" | wc -l | tr -d ' ')
    echo "[entrypoint] Restored ${FILE_COUNT} auth file(s) to ${AUTH_DIR}"
else
    echo "[entrypoint] WARNING: AUTH_FILES_B64 is not set. No auth files loaded."
    echo "[entrypoint] The proxy will start but OAuth-based providers will not work."
fi

# --------------------------------------------------------------------------
# 2. Generate config.yaml from template
# --------------------------------------------------------------------------
CONFIG_FILE="/CLIProxyAPI/config.yaml"
TEMPLATE_FILE="/CLIProxyAPI/config.template.yaml"

# Render assigns $PORT; default to 8317 for local testing
LISTEN_PORT="${PORT:-8317}"

# API keys from environment (comma-separated)
API_KEYS="${CLIPROXY_API_KEYS:-changeme}"

echo "[entrypoint] Generating config.yaml (port=${LISTEN_PORT})..."

# Build api-keys YAML list from comma-separated env var
API_KEYS_YAML=""
IFS=','
for key in ${API_KEYS}; do
    # Trim whitespace
    key=$(echo "${key}" | tr -d '[:space:]')
    API_KEYS_YAML="${API_KEYS_YAML}  - \"${key}\"\n"
done
unset IFS

# Generate config from template using sed replacements
sed \
    -e "s|__PORT__|${LISTEN_PORT}|g" \
    -e "s|__AUTH_DIR__|${AUTH_DIR}|g" \
    -e "s|__REQUEST_RETRY__|${CLIPROXY_REQUEST_RETRY:-3}|g" \
    -e "s|__MAX_RETRY_INTERVAL__|${CLIPROXY_MAX_RETRY_INTERVAL:-30}|g" \
    -e "s|__ROUTING_STRATEGY__|${CLIPROXY_ROUTING_STRATEGY:-round-robin}|g" \
    -e "s|__NONSTREAM_KEEPALIVE__|${CLIPROXY_NONSTREAM_KEEPALIVE:-30}|g" \
    -e "s|__DEBUG__|${CLIPROXY_DEBUG:-false}|g" \
    "${TEMPLATE_FILE}" > "${CONFIG_FILE}"

# Replace the api-keys placeholder with the generated list
# Use a temp file approach for multiline replacement
TEMP_FILE=$(mktemp)
while IFS= read -r line; do
    case "${line}" in
        *__API_KEYS__*)
            printf "%b" "${API_KEYS_YAML}"
            ;;
        *)
            printf "%s\n" "${line}"
            ;;
    esac
done < "${CONFIG_FILE}" > "${TEMP_FILE}"
mv "${TEMP_FILE}" "${CONFIG_FILE}"

echo "[entrypoint] Config written to ${CONFIG_FILE}"

# --------------------------------------------------------------------------
# 3. Start CLIProxyAPI
# --------------------------------------------------------------------------
echo "[entrypoint] Starting CLIProxyAPI on port ${LISTEN_PORT}..."

# The original image entrypoint is /CLIProxyAPI/CLIProxyAPI
exec /CLIProxyAPI/CLIProxyAPI
