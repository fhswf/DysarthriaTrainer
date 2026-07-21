#!/bin/bash

echo "Restarting WireGuard client..."
docker compose restart wireguard

echo "Waiting for container to start..."
sleep 5

echo ""
./scripts/check-vpn.sh
