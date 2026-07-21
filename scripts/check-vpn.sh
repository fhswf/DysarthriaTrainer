#!/bin/bash

echo "=== WireGuard Status ==="
docker exec wireguard-client wg show

echo ""
echo "=== Tunnel Connectivity ==="
if docker exec wireguard-client ping -c 3 -W 2 10.200.200.1 > /dev/null 2>&1; then
    echo "✅ Tunnel is UP"
else
    echo "❌ Tunnel is DOWN"
fi

echo ""
echo "=== Container Status ==="
docker compose ps wireguard

echo ""
echo "=== Health Check ==="
if curl -sf http://localhost:8000/api/v1/ > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi
