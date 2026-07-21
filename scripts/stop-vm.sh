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
echo "Stopping Google Cloud VM"
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
    exit 1
elif [ "$STATUS" = "TERMINATED" ] || [ "$STATUS" = "STOPPING" ]; then
    echo "✅ VM is already stopped (status: $STATUS)"
    echo ""
    echo "💡 Cost Breakdown (while stopped):"
    echo "   Compute:        €0/month (no charges)"
    echo "   Disk (10GB):    ~€0.40/month"
    echo "   Total:          ~€0.40/month"
    exit 0
fi

# Stop VM
echo "Stopping VM (status: $STATUS)..."
gcloud compute instances stop $VM_NAME --zone=$ZONE

# Wait for VM to stop
echo "Waiting for VM to stop..."
sleep 5

echo ""
echo "=========================================="
echo "✅ VM Stopped Successfully!"
echo "=========================================="
echo ""
echo "💡 Cost Breakdown (while stopped):"
echo "   Compute:        €0/month (no charges)"
echo "   Disk (10GB):    ~€0.40/month"
echo "   Total:          ~€0.40/month"
echo ""
echo "To start VM again:"
echo "  ./scripts/start-vm.sh"
echo ""
echo "To delete VM completely (no costs):"
echo "  ./scripts/delete-vm.sh"
