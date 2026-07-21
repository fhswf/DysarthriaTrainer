#!/bin/bash

set -e

# Load config or use defaults
if [ -f config/vm-info.txt ]; then
    source config/vm-info.txt
else
    VM_NAME="aki-proxy"
    ZONE="europe-west3-a"
    PROJECT_ID="aki-sprachtraining-demo"
fi

echo "=========================================="
echo "Starting Google Cloud VM"
echo "=========================================="
echo ""
echo "VM Name: $VM_NAME"
echo "Zone:    $ZONE"
echo "Project: $PROJECT_ID"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Check current status
echo "Checking current status..."
STATUS=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$STATUS" = "NOT_FOUND" ]; then
    echo "❌ Error: VM '$VM_NAME' not found in zone '$ZONE'"
    echo ""
    echo "Create it first with: ./scripts/create-vm.sh"
    exit 1
elif [ "$STATUS" = "RUNNING" ]; then
    echo "✅ VM is already running"
    EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
        --zone=$ZONE \
        --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
    NIP_IO_DOMAIN=$(echo $EXTERNAL_IP | tr '.' '-').nip.io
    echo ""
    echo "External IP:   $EXTERNAL_IP"
    echo "nip.io Domain: $NIP_IO_DOMAIN"
    echo "Demo URL:      https://$NIP_IO_DOMAIN"
    exit 0
fi

# Start VM
echo "Starting VM (status: $STATUS)..."
gcloud compute instances start $VM_NAME --zone=$ZONE

# Wait for VM to start
echo "Waiting for VM to start..."
sleep 10

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Convert IP for nip.io (dots to dashes)
NIP_IO_DOMAIN=$(echo $EXTERNAL_IP | tr '.' '-').nip.io

echo ""
echo "=========================================="
echo "✅ VM Started Successfully!"
echo "=========================================="
echo ""
echo "External IP:   $EXTERNAL_IP"
echo "nip.io Domain: $NIP_IO_DOMAIN"
echo "Demo URL:      https://$NIP_IO_DOMAIN"
echo ""
echo "SSH into VM:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""

# Update config file if it exists
if [ -f config/vm-info.txt ]; then
    sed -i "s/^EXTERNAL_IP=.*/EXTERNAL_IP=$EXTERNAL_IP/" config/vm-info.txt
    sed -i "s/^NIP_IO_DOMAIN=.*/NIP_IO_DOMAIN=$NIP_IO_DOMAIN/" config/vm-info.txt
    echo "Configuration updated: config/vm-info.txt"
fi
