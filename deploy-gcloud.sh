#!/bin/bash

# RL80 Bot - Google Cloud Deployment Script
# This script sets up and deploys the RL80 bot on Google Cloud

set -e  # Exit on error

echo "🚀 RL80 Bot - Google Cloud Deployment Script"
echo "============================================"

# Configuration
PROJECT_ID="${GCLOUD_PROJECT_ID:-your-project-id}"
ZONE="${GCLOUD_ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-rl80-bot}"
REGION="${GCLOUD_REGION:-us-central1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}Error: gcloud CLI is not installed${NC}"
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
}

# Function to check if instance exists
instance_exists() {
    gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID &> /dev/null
}

# Function to create the instance
create_instance() {
    echo -e "${YELLOW}Creating e2-micro instance (free tier)...${NC}"
    
    gcloud compute instances create $INSTANCE_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=e2-micro \
        --network-interface=network-tier=PREMIUM,subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --scopes=https://www.googleapis.com/auth/cloud-platform \
        --tags=http-server,https-server \
        --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image-family=ubuntu-2204-lts,image-project=ubuntu-os-cloud,mode=rw,size=30,type=pd-standard \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --reservation-affinity=any
    
    echo -e "${GREEN}Instance created successfully!${NC}"
}

# Function to setup firewall rules
setup_firewall() {
    echo -e "${YELLOW}Setting up firewall rules...${NC}"
    
    # Allow HTTP/HTTPS if needed for web interface
    gcloud compute firewall-rules create allow-http-https \
        --project=$PROJECT_ID \
        --allow tcp:80,tcp:443 \
        --source-ranges 0.0.0.0/0 \
        --target-tags http-server,https-server \
        --description "Allow HTTP and HTTPS traffic" 2>/dev/null || true
}

# Function to deploy the bot
deploy_bot() {
    echo -e "${YELLOW}Deploying RL80 bot to instance...${NC}"
    
    # Create deployment script
    cat > /tmp/setup-bot.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential git curl unzip

echo "📥 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"

echo "📥 Installing Node.js and PM2..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "📂 Setting up bot directory..."
cd ~
if [ -d "rl80-agent" ]; then
    echo "Updating existing bot installation..."
    cd rl80-agent
    git pull
else
    echo "Cloning bot repository..."
    git clone https://github.com/yourusername/rl80-agent.git
    cd rl80-agent
fi

echo "📦 Installing dependencies..."
bun install

echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

echo "📂 Creating data directories..."
mkdir -p data/.eliza/.elizadb
mkdir -p logs

echo "🚀 Setting up PM2..."
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'rl80-bot',
    script: 'bun',
    args: 'run elizaos start',
    cwd: '/home/$USER/rl80-agent',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    max_memory_restart: '900M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 5000,
    autorestart: true,
    max_restarts: 10
  }]
}
PM2EOF

echo "✅ Bot setup complete!"
echo ""
echo "⚠️  IMPORTANT: You need to configure your .env file with your API keys!"
echo "Run: nano ~/rl80-agent/.env"
echo ""
echo "Required environment variables:"
echo "- OPENAI_API_KEY"
echo "- TELEGRAM_BOT_TOKEN"
echo "- DISCORD_APPLICATION_ID (if using Discord)"
echo "- DISCORD_BOT_TOKEN (if using Discord)"
echo "- COINMARKETCAP_API_KEY (optional)"
EOF

    # Copy and execute setup script
    gcloud compute scp /tmp/setup-bot.sh $INSTANCE_NAME:~/setup-bot.sh --zone=$ZONE --project=$PROJECT_ID
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="chmod +x ~/setup-bot.sh && ~/setup-bot.sh"
}

# Function to start the bot
start_bot() {
    echo -e "${YELLOW}Starting the bot with PM2...${NC}"
    
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="
        cd ~/rl80-agent
        source ~/.bashrc
        export PATH=\"\$HOME/.bun/bin:\$PATH\"
        
        # Start the bot
        pm2 start ecosystem.config.js
        pm2 save
        pm2 startup | tail -n 1 | sudo bash
        
        echo ''
        echo '✅ Bot is now running!'
        echo ''
        echo 'Useful PM2 commands:'
        echo '  pm2 status          - Check bot status'
        echo '  pm2 logs rl80-bot   - View bot logs'
        echo '  pm2 restart rl80-bot - Restart the bot'
        echo '  pm2 stop rl80-bot   - Stop the bot'
    "
}

# Function to show connection info
show_connection_info() {
    EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
    
    echo ""
    echo -e "${GREEN}=== Deployment Complete ===${NC}"
    echo ""
    echo "Instance Name: $INSTANCE_NAME"
    echo "External IP: $EXTERNAL_IP"
    echo ""
    echo "To connect to your instance:"
    echo -e "${YELLOW}gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID${NC}"
    echo ""
    echo "To configure your bot:"
    echo "1. SSH into the instance"
    echo "2. Edit the .env file: nano ~/rl80-agent/.env"
    echo "3. Add your API keys"
    echo "4. Restart the bot: pm2 restart rl80-bot"
    echo ""
    echo "To view logs:"
    echo "pm2 logs rl80-bot"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}Setting up basic monitoring...${NC}"
    
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="
        # Setup log rotation
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 10M
        pm2 set pm2-logrotate:retain 7
        
        # Setup basic health check
        crontab -l 2>/dev/null | { cat; echo '*/5 * * * * pm2 describe rl80-bot > /dev/null || pm2 start /home/$USER/rl80-agent/ecosystem.config.js'; } | crontab -
    "
}

# Main execution
main() {
    echo "Checking prerequisites..."
    check_gcloud
    
    # Check if project ID is set
    if [ "$PROJECT_ID" = "your-project-id" ]; then
        echo -e "${RED}Error: Please set your Google Cloud project ID${NC}"
        echo "Export it as an environment variable:"
        echo "export GCLOUD_PROJECT_ID=your-actual-project-id"
        exit 1
    fi
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Check if instance already exists
    if instance_exists; then
        echo -e "${YELLOW}Instance $INSTANCE_NAME already exists${NC}"
        read -p "Do you want to redeploy the bot? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled"
            exit 0
        fi
    else
        create_instance
        setup_firewall
        
        # Wait for instance to be ready
        echo "Waiting for instance to be ready..."
        sleep 30
    fi
    
    # Deploy and start the bot
    deploy_bot
    
    # Configure environment variables
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Configure your environment variables${NC}"
    echo ""
    echo "You need to SSH into the instance and edit the .env file:"
    echo -e "${GREEN}gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID${NC}"
    echo "Then run: nano ~/rl80-agent/.env"
    echo ""
    read -p "Press Enter once you've configured the .env file..."
    
    # Start the bot
    start_bot
    setup_monitoring
    
    # Show connection information
    show_connection_info
}

# Run main function
main