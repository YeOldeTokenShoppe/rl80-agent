#!/bin/bash

# RL80 Bot Status Checker
# This script checks the status of your deployed bot

set -e

# Configuration (same as deploy script)
PROJECT_ID="${GCLOUD_PROJECT_ID:-your-project-id}"
ZONE="${GCLOUD_ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-rl80-bot}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 RL80 Bot Status Check${NC}"
echo "=========================="

# Check if instance exists
if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID &> /dev/null; then
    echo -e "${RED}❌ Instance $INSTANCE_NAME not found!${NC}"
    echo "Run ./deploy-gcloud.sh to create it"
    exit 1
fi

# Get instance status
INSTANCE_STATUS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --format='get(status)')
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "Instance Information:"
echo "  Name: $INSTANCE_NAME"
echo "  Status: $INSTANCE_STATUS"
echo "  External IP: $EXTERNAL_IP"
echo ""

if [ "$INSTANCE_STATUS" != "RUNNING" ]; then
    echo -e "${RED}⚠️  Instance is not running!${NC}"
    echo "Start it with:"
    echo "gcloud compute instances start $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
    exit 1
fi

echo -e "${YELLOW}Checking bot process...${NC}"

# Check PM2 status
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command="
    source ~/.bashrc
    export PATH=\"\$HOME/.bun/bin:\$PATH\"
    
    echo ''
    echo 'PM2 Process Status:'
    echo '==================='
    pm2 list
    
    echo ''
    echo 'Bot Memory Usage:'
    echo '================='
    pm2 describe rl80-bot | grep -E 'status|memory|restart'
    
    echo ''
    echo 'Recent Logs (last 20 lines):'
    echo '============================'
    pm2 logs rl80-bot --lines 20 --nostream
" 2>/dev/null || {
    echo -e "${RED}Could not connect to instance or PM2 not running${NC}"
    echo "The bot might not be installed. Run ./deploy-gcloud.sh first"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Status check complete!${NC}"
echo ""
echo "Useful commands:"
echo "  - View live logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE -- 'pm2 logs rl80-bot'"
echo "  - Restart bot: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE -- 'pm2 restart rl80-bot'"
echo "  - SSH to instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"