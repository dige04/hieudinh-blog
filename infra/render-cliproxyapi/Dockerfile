# CLIProxyAPI on Render.com
# Wraps the official image with startup scripts for:
#   - Dynamic port binding (Render assigns $PORT)
#   - Auth file injection from environment variables
#   - Health check support

FROM eceasy/cli-proxy-api:latest

# Install jq for JSON processing and tar for auth extraction
# The base image is Alpine-based (Go binary)
RUN apk add --no-cache bash jq tar coreutils 2>/dev/null || \
    (apt-get update && apt-get install -y --no-install-recommends bash jq tar coreutils && rm -rf /var/lib/apt/lists/*)

# Copy startup scripts
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy default config template
COPY config.template.yaml /CLIProxyAPI/config.template.yaml

# Render requires the service to listen on $PORT
# CLIProxyAPI default is 8317, we override at runtime
ENV PORT=8317

ENTRYPOINT ["/entrypoint.sh"]
