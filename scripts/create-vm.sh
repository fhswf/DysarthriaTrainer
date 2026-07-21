#!/bin/bash

set -e

# Configuration
PROJECT_ID="aki-sprachtraining-demo"  # Change this to your project ID
VM_NAME="aki-proxy"
ZONE="europe-west3-a"  # Frankfurt (closest to Germany)
MACHINE_TYPE="e2-micro"  # Free tier eligible
DISK_SIZE="10GB"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
NETWORK_TAGS="wireguard-vpn,http-server,https-server"

echo "=========================================="
echo "Creating Google Cloud VM for Demo Proxy"
echo "=========================================="
echo ""
echo "Project:      $PROJECT_ID"
echo "VM Name:      $VM_NAME"
echo "Zone:         $ZONE"
echo "Machine Type: $MACHINE_TYPE"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Create firewall rules
echo "Creating firewall rules..."

gcloud compute firewall-rules create allow-wireguard \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=udp:51820 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=wireguard-vpn \
    --description="Allow WireGuard VPN" \
    2>/dev/null || echo "✓ Firewall rule 'allow-wireguard' exists"

gcloud compute firewall-rules create allow-http \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server \
    --description="Allow HTTP (Let's Encrypt)" \
    2>/dev/null || echo "✓ Firewall rule 'allow-http' exists"

gcloud compute firewall-rules create allow-https \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=https-server \
    --description="Allow HTTPS" \
    2>/dev/null || echo "✓ Firewall rule 'allow-https' exists"

# Create VM
echo ""
echo "Creating VM instance..."
gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --tags=$NETWORK_TAGS \
    --create-disk=auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=$DISK_SIZE \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y curl wget git
'

# Wait for VM to be ready
echo ""
echo "Waiting for VM to start..."
sleep 15

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Convert IP for nip.io (dots to dashes)
NIP_IO_DOMAIN=$(echo $EXTERNAL_IP | tr '.' '-').nip.io

echo ""
echo "=========================================="
echo "✅ VM Created Successfully!"
echo "=========================================="
echo ""
echo "VM Name:        $VM_NAME"
echo "External IP:    $EXTERNAL_IP"
echo "Zone:           $ZONE"
echo "nip.io Domain:  $NIP_IO_DOMAIN"
echo ""
echo "SSH Command:"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "Demo URL (after setup):"
echo "  https://$NIP_IO_DOMAIN"
echo ""
echo "Estimated Cost: ~€0-3/month (free tier eligible)"
echo ""

# Save config
mkdir -p config
cat > config/vm-info.txt << EOF
VM_NAME=$VM_NAME
EXTERNAL_IP=$EXTERNAL_IP
ZONE=$ZONE
PROJECT_ID=$PROJECT_ID
NIP_IO_DOMAIN=$NIP_IO_DOMAIN
CREATED=$(date)
EOF

echo "Configuration saved to: config/vm-info.txt"
echo ""
echo "Next Steps:"
echo "  1. SSH into VM: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  2. Follow Module 03: WireGuard Configuration"
echo "  3. Follow Module 04: Traefik Setup"
echo ""
echo "Management Scripts:"
echo "  Start VM:  ./scripts/start-vm.sh"
echo "  Stop VM:   ./scripts/stop-vm.sh"
echo "  Status:    ./scripts/vm-status.sh"
echo "  Delete VM: ./scripts/delete-vm.sh"
