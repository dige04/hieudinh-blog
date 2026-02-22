# Research Report: CLIProxyAPI

## Executive Summary
CLIProxyAPI is an LLM proxy server that provides OpenAI/Gemini/Claude/Codex compatible API interfaces for CLI tools. It wraps various provider CLIs (Gemini, Antigravity, Codex, Claude Code) into a unified API service. For Windows deployment, the recommended approach is using Docker/Docker Compose, although native PowerShell scripts are available for building. A Windows-specific tray application "CLIProxyAPI Tray" and a fork "ProxyPilot" exist for better desktop integration.

## Key Findings

### 1. Technology Overview
- **Type:** LLM Proxy API
- **Purpose:** Exposes CLI-based LLM access as a standard API
- **Supported Providers:** Gemini, OpenAI (Codex), Claude, Qwen, Antigravity
- **Compatibility:** OpenAI/Gemini/Claude API compatible

### 2. Installation & Deployment (Windows)

#### Option A: Docker (Recommended)
This is the most stable and documented method.

1.  **Prerequisites:** Install Docker Desktop for Windows.
2.  **Clone:** `git clone https://github.com/router-for-me/CLIProxyAPI`
3.  **Config:** `copy config.example.yaml config.yaml`
4.  **Run:** `docker compose up -d`
5.  **Authenticate:**
    ```powershell
    docker compose exec cli-proxy-api /CLIProxyAPI/CLIProxyAPI -no-browser --login
    # For other providers: --codex-login, --claude-login, etc.
    ```

#### Option B: Windows Native (PowerShell)
The repo contains `docker-build.ps1`, suggesting native build support, but Docker is the primary path.
- **Tray App:** "CLIProxyAPI Tray" (separate tool) allows silent running in the system tray.
- **Service:** The related "CPA-XXX Panel" supports one-click systemd service installation, but native Windows Service support (via NSSM) is not explicitly documented in the core repo.

### 3. Configuration
- **File:** `config.yaml` (copied from `config.example.yaml`)
- **Key Settings:**
    - `host`: Bind address (default `0.0.0.0` or specific IP)
    - `port`: Default `8317`
    - `api-keys`: List of client keys allowed to access the proxy
    - `debug`: Boolean to toggle debug logging
    - `logging-to-file`: Boolean for file-based logging
- **Env Vars:** Supported via `.env` file (template `.env.example`).

### 4. Releases
- **Latest:** v6.8.18
- **Binaries:** No direct Windows `.exe` binaries found in standard release assets. Docker images are the primary distribution format.

## Implementation Recommendations

### Quick Start (Windows VPS)
1.  Install Docker Desktop.
2.  Clone repo: `git clone https://github.com/router-for-me/CLIProxyAPI`
3.  Setup config: `cd CLIProxyAPI; copy config.example.yaml config.yaml`
4.  Start: `docker compose up -d`
5.  Perform authentication inside the container for each provider you intend to use.

### Running as Service
- **Docker:** Use `restart: unless-stopped` in `docker-compose.yml` (standard practice, though not explicitly in the snippet).
- **Native:** Use "CLIProxyAPI Tray" for desktop-like background execution, or wrap the startup command with NSSM if a true Windows Service is required.

## Unresolved Questions
- Native Windows binary availability remains unconfirmed (likely non-existent, relying on Docker or source build).
- Explicit "Windows Service" instructions (non-Docker) are missing from core docs; NSSM is the standard workaround.
