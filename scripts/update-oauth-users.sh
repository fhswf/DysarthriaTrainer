#!/bin/bash

# Update GitHub OAuth2 allowed users on cloud VM

set -e

VM_NAME="aki-proxy"
ZONE="europe-west3-a"
USERS_FILE="config/github-allowed-users.txt"

echo "=========================================="
echo "Updating OAuth2 Allowed Users"
echo "=========================================="

# Read users from file (skip comments and empty lines)
USERS=$(grep -v '^#' "$USERS_FILE" | grep -v '^$' | tr '\n' ',' | sed 's/,$//')

if [ -z "$USERS" ]; then
    echo "⚠️  No users found in $USERS_FILE"
    echo "Please add GitHub usernames (one per line)"
    exit 1
fi

echo "Allowed users: $USERS"
echo ""

# Update on VM
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
cd ~/traefik
sed -i 's/OAUTH2_PROXY_GITHUB_USER=.*/OAUTH2_PROXY_GITHUB_USER=$USERS/' docker-compose.yml
docker compose up -d
echo ''
echo '✅ OAuth2 users updated!'
echo 'Allowed GitHub users: $USERS'
"

echo ""
echo "Done! Users can now access https://35-234-119-225.nip.io"
