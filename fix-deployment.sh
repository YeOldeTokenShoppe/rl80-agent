#!/bin/bash

# Fix script for existing Google Cloud deployment
# Run this ON YOUR GCE INSTANCE

echo "🔧 RL80 Bot - Deployment Fix Script"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ensure we're in the right directory
cd ~/rl80-agent || {
    echo -e "${RED}Error: rl80-agent directory not found!${NC}"
    echo "Please ensure you're in the home directory and the bot is cloned"
    exit 1
}

# Step 1: Check current PM2 status
echo -e "${YELLOW}1. Checking current PM2 processes...${NC}"
pm2 list

# Step 2: Stop any existing processes
echo -e "${YELLOW}2. Stopping existing processes...${NC}"
pm2 delete all 2>/dev/null || true

# Step 3: Create proper PM2 ecosystem file
echo -e "${YELLOW}3. Creating PM2 ecosystem configuration...${NC}"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rl80-bot',
    script: 'bun',
    args: 'run elizaos start',
    cwd: process.env.HOME + '/rl80-agent',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    // Memory management for e2-micro (1GB RAM)
    max_memory_restart: '800M',
    
    // Restart policies
    autorestart: true,
    watch: false,
    max_restarts: 50,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    
    // Advanced options
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 3000
  }]
}
EOF

# Step 4: Create logs directory
echo -e "${YELLOW}4. Creating logs directory...${NC}"
mkdir -p logs

# Step 5: Check environment variables
echo -e "${YELLOW}5. Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}Warning: .env file not found!${NC}"
    echo "Creating .env from example..."
    cp .env.example .env 2>/dev/null || touch .env
fi

echo ""
echo "Current environment variables (masked):"
grep -E "TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|OPENAI_API_KEY" .env | sed 's/=.*/=***/'

# Step 6: Pull latest code
echo -e "${YELLOW}6. Updating to latest code...${NC}"
git pull || echo "Could not pull updates (might not be a git repo)"

# Step 7: Install/update dependencies
echo -e "${YELLOW}7. Installing dependencies...${NC}"
bun install

# Step 8: Start the bot with PM2
echo -e "${YELLOW}8. Starting bot with PM2...${NC}"
pm2 start ecosystem.config.js

# Step 9: Save PM2 configuration
echo -e "${YELLOW}9. Saving PM2 configuration...${NC}"
pm2 save

# Step 10: Setup startup script
echo -e "${YELLOW}10. Setting up auto-start on reboot...${NC}"
pm2 startup | grep sudo | bash

# Step 11: Install log rotation
echo -e "${YELLOW}11. Setting up log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Step 12: Show status
echo ""
echo -e "${GREEN}✅ Deployment fixed!${NC}"
echo ""
echo "Current status:"
pm2 list
echo ""
echo -e "${YELLOW}Important commands:${NC}"
echo "  pm2 logs rl80-bot    - View real-time logs"
echo "  pm2 monit            - Monitor CPU/Memory"
echo "  pm2 restart rl80-bot - Restart the bot"
echo "  pm2 stop rl80-bot    - Stop the bot"
echo ""

# Check if environment variables are set
if ! grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    echo -e "${RED}⚠️  WARNING: OPENAI_API_KEY not set in .env${NC}"
fi
if ! grep -q "TELEGRAM_BOT_TOKEN=.*:.*" .env 2>/dev/null; then
    echo -e "${RED}⚠️  WARNING: TELEGRAM_BOT_TOKEN not set in .env${NC}"
fi

echo ""
echo -e "${YELLOW}If your bot is still not responding:${NC}"
echo "1. Check your API keys: nano .env"
echo "2. View error logs: pm2 logs rl80-bot --err"
echo "3. Check system resources: free -h"
echo "4. Restart after fixing: pm2 restart rl80-bot"
EOF