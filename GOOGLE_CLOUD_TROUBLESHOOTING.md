# Google Cloud Deployment Troubleshooting Guide for RL80 Bot

## Common Issues and Solutions

### 1. Bot Not Staying Online

**Symptoms:**
- Bot goes offline after deployment
- Telegram/Discord shows bot as offline
- No responses to messages

**Solutions:**

1. **Check Instance Status:**
   ```bash
   ./check-bot-status.sh
   ```

2. **Verify Environment Variables:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a
   cat ~/rl80-agent/.env
   ```
   Make sure all required tokens are set:
   - `OPENAI_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `DISCORD_BOT_TOKEN` and `DISCORD_APPLICATION_ID`

3. **Check PM2 Status:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a -- 'pm2 status'
   ```

4. **Restart the Bot:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a -- 'pm2 restart rl80-bot'
   ```

### 2. Bot Crashes on Startup

**Check Error Logs:**
```bash
gcloud compute ssh rl80-bot --zone=us-central1-a -- 'pm2 logs rl80-bot --err --lines 50'
```

**Common Causes:**
- Missing API keys in `.env`
- Invalid bot tokens
- Network connectivity issues
- Insufficient memory

### 3. Memory Issues (e2-micro limitations)

The free tier e2-micro instance has only 1GB RAM. If the bot crashes due to memory:

1. **Check Memory Usage:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a -- 'free -h'
   ```

2. **Optimize Memory:**
   Edit `ecosystem.config.js`:
   ```javascript
   max_memory_restart: '800M',  // Lower from 900M
   ```

3. **Add Swap Space:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

### 4. Bot Not Responding to Commands

1. **Check Bot Registration:**
   - Telegram: Verify with @BotFather that your bot is active
   - Discord: Check bot permissions in Discord Developer Portal

2. **Verify Character Configuration:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a
   cd ~/rl80-agent
   cat src/character.ts | grep -A5 "plugins:"
   ```

3. **Test Locally First:**
   ```bash
   cd /Users/michellepaulson/rl80-agent-v3/rl80-agent
   bun run elizaos start
   ```

### 5. Google Cloud Billing Issues

**Free Tier Limits:**
- 1 e2-micro instance per month
- 30GB standard persistent disk
- 1GB network egress

**Monitor Usage:**
```bash
gcloud compute instances list
gcloud compute disks list
```

### 6. Deployment Script Errors

**"Instance already exists"**
- Choose 'y' to redeploy
- Or delete and recreate:
  ```bash
  gcloud compute instances delete rl80-bot --zone=us-central1-a
  ./deploy-gcloud.sh
  ```

**"Permission denied"**
- Ensure you're authenticated:
  ```bash
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID
  ```

### 7. Bot Updates

**To update your bot code:**
```bash
gcloud compute ssh rl80-bot --zone=us-central1-a -- '
  cd ~/rl80-agent
  git pull
  bun install
  pm2 restart rl80-bot
'
```

## Quick Diagnostics Command

Run this to get a full diagnostic:
```bash
gcloud compute ssh rl80-bot --zone=us-central1-a -- '
  echo "=== System Info ==="
  free -h
  df -h
  echo ""
  echo "=== Bot Status ==="
  pm2 list
  echo ""
  echo "=== Recent Errors ==="
  pm2 logs rl80-bot --err --lines 20 --nostream
  echo ""
  echo "=== Environment Check ==="
  cd ~/rl80-agent
  [ -f .env ] && echo ".env exists" || echo ".env MISSING!"
  grep -E "TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|OPENAI_API_KEY" .env | sed "s/=.*/=***/"
'
```

## Emergency Recovery

If the bot is completely broken:

1. **Save your .env file:**
   ```bash
   gcloud compute scp rl80-bot:~/rl80-agent/.env ./env-backup --zone=us-central1-a
   ```

2. **Recreate the instance:**
   ```bash
   gcloud compute instances delete rl80-bot --zone=us-central1-a
   ./deploy-gcloud.sh
   ```

3. **Restore .env:**
   ```bash
   gcloud compute scp ./env-backup rl80-bot:~/rl80-agent/.env --zone=us-central1-a
   ```

4. **Start the bot:**
   ```bash
   gcloud compute ssh rl80-bot --zone=us-central1-a -- 'cd ~/rl80-agent && pm2 start ecosystem.config.js'
   ```

## Support Resources

- ElizaOS Docs: https://docs.elizaos.ai
- Google Cloud Free Tier: https://cloud.google.com/free
- PM2 Docs: https://pm2.keymetrics.io/docs