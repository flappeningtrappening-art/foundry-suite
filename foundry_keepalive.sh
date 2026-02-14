#!/bin/bash

# FOUNDRY ENGINE KEEPALIVE (v1.0)
# This script ensures the Production Server on Port 3400 never stays down.

PORT=3400
SERVER_DIR="/home/blitz/monetization/foundry-suite/solution-factory/apps/genkit-server"

echo "--- [KEEPALIVE] Monitoring Port $PORT ---"

while true; do
  if ! lsof -i :$PORT > /dev/null; then
    echo "[!] Port $PORT is DOWN. Restarting Production Server..."
    cd $SERVER_DIR && npx tsx --env-file=.env src/server.ts >> ../../../genkit_svc.log 2>&1 &
    sleep 5
  else
    # Heartbeat
    sleep 10
  fi
done
