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
echo "Google Cloud VM Status"
echo "=========================================="
echo ""

# Set project
gcloud config set project $PROJECT_ID 2>/dev/null

# Check if VM exists
STATUS=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(status)' 2>/dev/null || echo "NOT_FOUND")

if [ "$STATUS" = "NOT_FOUND" ]; then
    echo "❌ VM '$VM_NAME' not found in zone '$ZONE'"
    echo ""
    echo "Create it with: ./scripts/create-vm.sh"
    exit 1
fi

# Get VM details
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null || echo "N/A")

INTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].networkIP)' 2>/dev/null || echo "N/A")

MACHINE_TYPE=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(machineType)' 2>/dev/null || echo "N/A")
MACHINE_TYPE=$(basename "$MACHINE_TYPE")

DISK_SIZE=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(disks[0].diskSizeGb)' 2>/dev/null || echo "N/A")

# Convert IP for nip.io if running
if [ "$STATUS" = "RUNNING" ] && [ "$EXTERNAL_IP" != "N/A" ]; then
    NIP_IO_DOMAIN=$(echo $EXTERNAL_IP | tr '.' '-').nip.io
else
    NIP_IO_DOMAIN="N/A (VM not running)"
fi

# Display status with color
if [ "$STATUS" = "RUNNING" ]; then
    STATUS_ICON="✅"
    COST_NOTE="~€0-3/month (free tier eligible)"
elif [ "$STATUS" = "TERMINATED" ]; then
    STATUS_ICON="⏸️"
    COST_NOTE="~€0.40/month (disk storage only)"
else
    STATUS_ICON="⚠️"
    COST_NOTE="Unknown"
fi

echo "VM Name:        $VM_NAME"
echo "Status:         $STATUS_ICON $STATUS"
echo "Zone:           $ZONE"
echo "Machine Type:   $MACHINE_TYPE"
echo "Disk Size:      ${DISK_SIZE}GB"
echo ""
echo "Network:"
echo "  External IP:  $EXTERNAL_IP"
echo "  Internal IP:  $INTERNAL_IP"
echo "  nip.io:       $NIP_IO_DOMAIN"
echo ""
echo "Estimated Cost: $COST_NOTE"
echo ""

if [ "$STATUS" = "RUNNING" ]; then
    echo "Demo URL:       https://$NIP_IO_DOMAIN"
    echo ""
    echo "SSH Command:"
    echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
    echo ""
    echo "Actions:"
    echo "  Stop VM:  ./scripts/stop-vm.sh"
fi

if [ "$STATUS" = "TERMINATED" ]; then
    echo "Actions:"
    echo "  Start VM: ./scripts/start-vm.sh"
fi

echo ""
echo "Other Commands:"
echo "  Delete VM: ./scripts/delete-vm.sh"
echo "  List all:  gcloud compute instances list"
