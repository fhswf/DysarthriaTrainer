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
echo "⚠️  DELETE Google Cloud VM"
echo "=========================================="
echo ""
echo "VM Name: $VM_NAME"
echo "Zone:    $ZONE"
echo "Project: $PROJECT_ID"
echo ""
echo "⚠️  WARNING: This will permanently delete:"
echo "   - VM instance"
echo "   - Boot disk (all data)"
echo "   - External IP (if ephemeral)"
echo ""
echo "✅ Cost after deletion: €0/month"
echo ""

# Set project
gcloud config set project $PROJECT_ID 2>/dev/null

# Check if VM exists
STATUS=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$STATUS" = "NOT_FOUND" ]; then
    echo "✅ VM '$VM_NAME' not found (already deleted)"
    exit 0
fi

# Confirmation prompt
read -p "Are you sure you want to DELETE this VM? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Deletion cancelled"
    exit 0
fi

echo ""
echo "Deleting VM..."
gcloud compute instances delete $VM_NAME \
    --zone=$ZONE \
    --quiet

echo ""
echo "=========================================="
echo "✅ VM Deleted Successfully!"
echo "=========================================="
echo ""
echo "Cost: €0/month"
echo ""
echo "To create a new VM:"
echo "  ./scripts/create-vm.sh"
echo ""

# Archive config file
if [ -f config/vm-info.txt ]; then
    mv config/vm-info.txt config/vm-info.txt.deleted-$(date +%Y%m%d-%H%M%S)
    echo "Config archived: config/vm-info.txt.deleted-*"
fi
