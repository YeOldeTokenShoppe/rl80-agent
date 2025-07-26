#!/bin/bash

# Google Cloud Compute Engine Setup for RL80 Bot
# This uses the free tier e2-micro instance

echo "🚀 Setting up RL80 Bot on Google Cloud..."

# 1. Set your project ID
PROJECT_ID="your-firebase-project-id"
ZONE="us-central1-a"  # Change if needed
INSTANCE_NAME="rl80-bot"

# 2. Create the instance
echo "Creating e2-micro instance (free tier)..."
gcloud compute instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=e2-micro \
  --network-interface=network-tier=PREMIUM,subnet=default \
  --maintenance-policy=MIGRATE \
  --provisioning-model=STANDARD \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image-family=ubuntu-2204-lts,image-project=ubuntu-os-cloud,mode=rw,size=30,type=pd-standard \
  --no-shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring \
  --reservation-affinity=any

# 3. Wait for instance to be ready
echo "Waiting for instance to be ready..."
sleep 30

# 4. SSH and install dependencies
echo "Installing bot dependencies..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
  # Install Bun
  curl -fsSL https://bun.sh/install | bash
  source ~/.bashrc
  
  # Install Node.js and PM2
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  sudo npm install -g pm2
  
  # Install git
  sudo apt-get update
  sudo apt-get install -y git
"

echo "✅ Instance created! Now SSH in to complete setup:"
echo "gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "Then run:"
echo "1. git clone <your-repo>"
echo "2. cd rl80-agent"
echo "3. bun install"
echo "4. nano .env (add your keys)"
echo "5. pm2 start 'bun run elizaos start' --name rl80"
echo "6. pm2 save && pm2 startup"