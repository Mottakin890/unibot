#!/bin/bash
set -e

echo "=========================================="
echo " UniBot: VPS Local LLM Setup Script       "
echo " Target Model: llama3.2 (3B Parameters)   "
echo "=========================================="

# 1. Install Ollama if not present
if ! command -v ollama &> /dev/null; then
    echo "[1/4] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[1/4] Ollama is already installed. Skipping installation."
fi

# 2. Configure Ollama to listen on all interfaces (0.0.0.0)
# By default, it only listens to localhost. We need it accessible via IP.
echo "[2/4] Configuring Ollama network interface to 0.0.0.0..."
SERVICE_DIR="/etc/systemd/system/ollama.service.d"
mkdir -p "$SERVICE_DIR"

cat <<EOF > "$SERVICE_DIR/override.conf"
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
EOF

# 3. Apply changes and restart
echo "[3/4] Restarting Ollama service..."
systemctl daemon-reload
systemctl restart ollama || {
    echo "Warning: could not restart via systemd. Trying to start manually in background..."
    ollama serve &
    sleep 3
}

# 4. Pull the target model
echo "[4/4] Pulling 'llama3.2' (Takes a few minutes depending on network)..."
# We'll pull the default 3B version
ollama pull llama3.2

echo "=========================================="
echo " Setup Complete!                          "
echo " Your internal AI API is now running at:  "
echo " http://$(hostname -I | awk '{print $1}'):11434 "
echo "=========================================="
