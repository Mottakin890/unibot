#!/bin/bash
# ============================================================
#  UniBot: VPS Local LLM Setup Script
#  Target Model: llama3.2 (3B Parameters)
#  Run as root or with sudo on the VPS.
# ============================================================
set -euo pipefail

MODEL="${1:-llama3.2}"          # Override by: ./setup-vps-llm.sh mistral
APP_DIR="${2:-/var/www/unibot}" # Override by: ./setup-vps-llm.sh llama3.2 /path/to/app

echo ""
echo "=============================================="
echo "  UniBot VPS LLM Setup"
echo "  Model : $MODEL"
echo "  App   : $APP_DIR"
echo "=============================================="
echo ""

# ── 1. Install Ollama ────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
    echo "[1/6] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[1/6] Ollama already installed — skipping."
fi

# ── 2. Lock Ollama to loopback only (security) ───────────────
echo "[2/6] Binding Ollama to 127.0.0.1 (localhost only)..."
SERVICE_DIR="/etc/systemd/system/ollama.service.d"
mkdir -p "$SERVICE_DIR"

cat >"$SERVICE_DIR/override.conf" <<EOF
[Service]
Environment="OLLAMA_HOST=127.0.0.1"
EOF

# ── 3. Enable Ollama on boot + restart ───────────────────────
echo "[3/6] Enabling Ollama to start on boot..."
systemctl daemon-reload
systemctl enable ollama 2>/dev/null || echo "  Note: systemctl enable failed (non-systemd environment?)"
systemctl restart ollama 2>/dev/null || {
    echo "  Note: systemd restart failed — starting Ollama manually in background..."
    pkill -f "ollama serve" 2>/dev/null || true
    OLLAMA_HOST=127.0.0.1 ollama serve &
    sleep 4
}

# Wait until Ollama is responsive (up to 30s)
echo "  Waiting for Ollama to be ready..."
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        echo "  Ollama is ready."
        break
    fi
    sleep 2
    if [ "$i" -eq 15 ]; then
        echo "  WARNING: Ollama did not respond in 30s. Continue anyway..."
    fi
done

# ── 4. Pull the model ────────────────────────────────────────
echo "[4/6] Pulling model '$MODEL' (this may take a few minutes)..."
ollama pull "$MODEL"

# ── 5. Quick health test ─────────────────────────────────────
echo "[5/6] Running a quick health test on model '$MODEL'..."
TEST_RESPONSE=$(ollama run "$MODEL" "Reply with exactly: OK" 2>/dev/null | head -c 20 || echo "")
if echo "$TEST_RESPONSE" | grep -qi "ok"; then
    echo "  Model responded correctly."
else
    echo "  WARNING: Unexpected model response: '$TEST_RESPONSE'"
    echo "  The model may still be loading — proceed and test via the app."
fi

# ── 6. Write env vars to the Next.js app ─────────────────────
echo "[6/6] Writing Ollama env vars to $APP_DIR/.env.local ..."
ENV_FILE="$APP_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
    # Remove existing Ollama lines so we don't create duplicates
    sed -i '/^OLLAMA_BASE_URL=/d' "$ENV_FILE"
    sed -i '/^OLLAMA_DEFAULT_MODEL=/d' "$ENV_FILE"
fi

# Append the updated values
cat >>"$ENV_FILE" <<EOF

# Ollama — written by setup-vps-llm.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
OLLAMA_BASE_URL="http://127.0.0.1:11434/v1"
OLLAMA_DEFAULT_MODEL="$MODEL"
EOF

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo ""
echo "  Ollama is running at : http://127.0.0.1:11434"
echo "  Model loaded         : $MODEL"
echo "  Env file updated     : $ENV_FILE"
echo ""
echo "  Next steps:"
echo "  1. Restart your Next.js app:"
echo "     pm2 restart all   OR   npm run build && npm start"
echo "  2. Open your chatbot dashboard and send a test message."
echo "  3. Verify Ollama stays up after a reboot: sudo reboot"
echo "=============================================="
