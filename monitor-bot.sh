#!/bin/bash

# Bot Monitoring Script
# Run this locally to monitor your GCE bot status

# Configuration
PROJECT_ID="${GCLOUD_PROJECT_ID:-hailmary-3ff6c}"
ZONE="${GCLOUD_ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-rl80-bot}"
TELEGRAM_BOT_NAME="@RL80coin_bot"  # Update with your bot name

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 RL80 Bot Monitor${NC}"
echo "===================="
echo "Checking every 5 minutes..."
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check instance status
    INSTANCE_STATUS=$(gcloud compute instances describe $INSTANCE_NAME \
        --zone=$ZONE --project=$PROJECT_ID \
        --format='get(status)' 2>/dev/null)
    
    if [ -z "$INSTANCE_STATUS" ]; then
        echo -e "[$TIMESTAMP] ${RED}❌ ERROR: Cannot connect to Google Cloud${NC}"
    elif [ "$INSTANCE_STATUS" != "RUNNING" ]; then
        echo -e "[$TIMESTAMP] ${RED}⚠️  Instance Status: $INSTANCE_STATUS${NC}"
        echo "Attempting to start instance..."
        gcloud compute instances start $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID
    else
        # Check PM2 process
        PM2_STATUS=$(gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID \
            --command="pm2 list --no-color | grep rl80-bot | awk '{print \$10}'" 2>/dev/null)
        
        if [ "$PM2_STATUS" = "online" ]; then
            # Get memory usage
            MEMORY=$(gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID \
                --command="pm2 describe rl80-bot | grep memory | head -1 | awk '{print \$4}'" 2>/dev/null)
            echo -e "[$TIMESTAMP] ${GREEN}✅ Bot Online${NC} | Memory: $MEMORY"
        else
            echo -e "[$TIMESTAMP] ${RED}❌ Bot Offline or Error${NC}"
            echo "Attempting restart..."
            gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID \
                --command="cd ~/apps/rl80-agent && pm2 restart rl80-bot" 2>/dev/null
        fi
    fi
    
    # Wait 5 minutes
    sleep 300
done