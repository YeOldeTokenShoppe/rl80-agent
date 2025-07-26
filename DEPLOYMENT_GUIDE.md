# ElizaOS Bot Deployment Guide

## Recommended Hosting Options

### 1. **Railway.app** (Recommended for Beginners)
- **Pros**: Easy deployment, built-in PostgreSQL, automatic SSL, great for bots
- **Cons**: Can get expensive with high usage
- **Cost**: ~$5-20/month
- **PGLite**: Works perfectly

#### Railway Setup:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project in your bot directory
cd /Users/michellepaulson/rl80-agent-v3/rl80-agent
railway init

# Link to GitHub (recommended)
railway link

# Deploy
railway up
```

### 2. **DigitalOcean Droplet** (Best Control)
- **Pros**: Full control, predictable pricing, good performance
- **Cons**: Requires Linux knowledge
- **Cost**: $6-12/month
- **Storage**: 25-50GB SSD included

#### DigitalOcean Setup:
```bash
# After creating a droplet (Ubuntu 22.04 recommended)
ssh root@your-droplet-ip

# Install dependencies
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 for process management
npm install -g pm2

# Clone your repository
git clone https://github.com/yourusername/rl80-agent.git
cd rl80-agent

# Install dependencies
bun install

# Set up environment
nano .env  # Add your API keys

# Start with PM2
pm2 start "bun run elizaos start" --name rl80-bot
pm2 save
pm2 startup
```

### 3. **Google Cloud Run** (Auto-scaling)
- **Pros**: Scales to zero, pay per use, handles traffic spikes
- **Cons**: Cold starts, stateless by default
- **Cost**: ~$0-50/month depending on usage

### 4. **VPS Providers** (Budget-Friendly)
- **Hetzner**: €4.51/month (2 vCPU, 4GB RAM)
- **Contabo**: $5.99/month (4 vCPU, 8GB RAM)
- **OVH**: $6/month (2 vCPU, 4GB RAM)

## Production Setup Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Production deployment script for ElizaOS bot

echo "🚀 Starting ElizaOS Bot Deployment..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Bun
if ! command -v bun &> /dev/null; then
    echo "📥 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# 3. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
fi

# 4. Set up bot directory
BOT_DIR="/opt/rl80-bot"
sudo mkdir -p $BOT_DIR
sudo chown $USER:$USER $BOT_DIR

# 5. Copy bot files
echo "📂 Copying bot files..."
cp -r . $BOT_DIR/
cd $BOT_DIR

# 6. Install dependencies
echo "📦 Installing dependencies..."
bun install

# 7. Set up environment
if [ ! -f .env ]; then
    echo "⚙️ Setting up environment..."
    cp .env.example .env
    echo "Please edit .env with your API keys!"
    nano .env
fi

# 8. Set up data directory for PGLite
mkdir -p .eliza/.elizadb

# 9. Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'rl80-bot',
    script: 'bun',
    args: 'run elizaos start',
    cwd: '$BOT_DIR',
    env: {
      NODE_ENV: 'production',
      PGLITE_DATA_DIR: '$BOT_DIR/.eliza/.elizadb'
    },
    max_memory_restart: '1G',
    error_file: '$BOT_DIR/logs/error.log',
    out_file: '$BOT_DIR/logs/out.log',
    time: true
  }]
}
EOF

# 10. Start the bot
echo "🤖 Starting bot with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "📊 Monitor with: pm2 monit"
echo "📜 View logs with: pm2 logs rl80-bot"
echo "🔄 Restart with: pm2 restart rl80-bot"
```

## Docker Deployment (Alternative)

Create `Dockerfile`:

```dockerfile
FROM oven/bun:1-debian

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p .eliza/.elizadb

# Expose port (if using web interface)
EXPOSE 3000

# Start the application
CMD ["bun", "run", "elizaos", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  rl80-bot:
    build: .
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/app/.eliza
    environment:
      - NODE_ENV=production
      - PGLITE_DATA_DIR=/app/.eliza/.elizadb
    deploy:
      resources:
        limits:
          memory: 2G
```

## Environment Variables for Production

Create `.env.production`:

```bash
# Production Environment
NODE_ENV=production
LOG_LEVEL=info

# Database (PGLite)
PGLITE_DATA_DIR=/opt/rl80-bot/.eliza/.elizadb

# API Keys (use environment-specific keys)
OPENAI_API_KEY=sk-prod-xxx
COINMARKETCAP_API_KEY=prod-xxx

# Discord
DISCORD_APPLICATION_ID=xxx
DISCORD_BOT_TOKEN=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Backup Strategy

Create `backup.sh`:

```bash
#!/bin/bash

# Backup script for ElizaOS bot data

BACKUP_DIR="/backup/rl80-bot"
DATA_DIR="/opt/rl80-bot/.eliza"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PGLite database
tar -czf "$BACKUP_DIR/elizadb_$DATE.tar.gz" -C "$DATA_DIR" .elizadb

# Keep only last 7 days of backups
find $BACKUP_DIR -name "elizadb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: elizadb_$DATE.tar.gz"
```

Add to crontab:
```bash
# Daily backup at 3 AM
0 3 * * * /opt/rl80-bot/backup.sh
```

## Monitoring Setup

### 1. **Uptime Monitoring**
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor Discord bot status
- Alert on downtime

### 2. **PM2 Monitoring**
```bash
# Install PM2 web dashboard
pm2 install pm2-logrotate
pm2 web

# Access at http://your-server:9615
```

### 3. **Health Check Endpoint**
Add to your bot:
```javascript
// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

## Quick Start Commands

```bash
# For Railway
railway up

# For VPS/DigitalOcean
bash deploy.sh

# For Docker
docker-compose up -d

# Check status
pm2 status
pm2 logs rl80-bot --lines 100

# Restart
pm2 restart rl80-bot

# Update bot
git pull
bun install
pm2 restart rl80-bot
```

## Cost Comparison

| Provider | Monthly Cost | Best For |
|----------|-------------|----------|
| Railway | $5-20 | Quick start, auto-scaling |
| DigitalOcean | $6-12 | Full control, predictable |
| Hetzner | €4.51 | EU-based, budget |
| Google Cloud | $0-50 | Variable traffic |
| Contabo | $5.99 | Maximum resources/$ |

## Recommended: Start with Railway

1. Push your code to GitHub
2. Connect Railway to your repo
3. It auto-deploys on every push
4. PGLite works out of the box
5. Easy environment variable management

Your bot will be online 24/7 with persistent memory!