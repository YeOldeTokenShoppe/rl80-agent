#!/bin/bash

# Monitoring Setup Script for GCE Instance
# Run this ON YOUR GCE INSTANCE to set up monitoring

echo "🔧 Setting up bot monitoring..."

# 1. Create health check script
cat > ~/check-bot-health.sh << 'EOF'
#!/bin/bash

# Check if PM2 process is running
PM2_STATUS=$(pm2 list --no-color | grep rl80-bot | awk '{print $10}')

if [ "$PM2_STATUS" != "online" ]; then
    echo "Bot is offline, restarting..."
    cd ~/apps/rl80-agent
    pm2 restart rl80-bot
    
    # Log the restart
    echo "[$(date)] Bot was offline and restarted" >> ~/bot-restarts.log
fi

# Check memory usage
MEMORY_PERCENT=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
if (( $(echo "$MEMORY_PERCENT > 85" | bc -l) )); then
    echo "[$(date)] High memory usage: ${MEMORY_PERCENT}%" >> ~/bot-restarts.log
    pm2 restart rl80-bot
fi

# Check if bot is responding (by checking recent logs)
RECENT_LOGS=$(pm2 logs rl80-bot --lines 10 --nostream --timestamp | tail -1 | cut -d' ' -f1-2)
CURRENT_TIME=$(date +%s)
if [ ! -z "$RECENT_LOGS" ]; then
    LOG_TIME=$(date -d "$RECENT_LOGS" +%s 2>/dev/null || echo 0)
    TIME_DIFF=$((CURRENT_TIME - LOG_TIME))
    
    # If no logs in last 10 minutes, restart
    if [ $TIME_DIFF -gt 600 ]; then
        echo "[$(date)] No recent activity, restarting bot" >> ~/bot-restarts.log
        pm2 restart rl80-bot
    fi
fi
EOF

chmod +x ~/check-bot-health.sh

# 2. Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/check-bot-health.sh") | crontab -

# 3. Set up PM2 auto-restart on high memory
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 4. Create uptime webhook notifier (optional)
cat > ~/notify-webhook.sh << 'EOF'
#!/bin/bash

# Webhook notification script
# Set your webhook URL here (Discord, Slack, or custom)
WEBHOOK_URL=""  # Add your webhook URL

if [ ! -z "$WEBHOOK_URL" ]; then
    STATUS=$1
    MESSAGE=$2
    
    curl -H "Content-Type: application/json" \
         -X POST \
         -d "{\"content\":\"🤖 RL80 Bot Alert: $STATUS - $MESSAGE\"}" \
         $WEBHOOK_URL
fi
EOF

chmod +x ~/notify-webhook.sh

# 5. Update PM2 ecosystem config for better monitoring
cd ~/apps/rl80-agent
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rl80-bot',
    script: 'bun',
    args: 'run elizaos start',
    cwd: process.env.HOME + '/apps/rl80-agent',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    
    // Memory management
    max_memory_restart: '800M',
    
    // Restart policies
    autorestart: true,
    watch: false,
    max_restarts: 50,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Advanced monitoring
    instance_var: 'INSTANCE_ID',
    exec_mode: 'fork',
    
    // Error handling
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Health check
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Monitoring hooks
    events: {
      restart: function() {
        console.log('Bot restarted at', new Date());
      },
      exit: function() {
        console.log('Bot exited at', new Date());
      }
    }
  }]
}
EOF

# 6. Restart with new config
pm2 delete rl80-bot
pm2 start ecosystem.config.js
pm2 save

echo "✅ Monitoring setup complete!"
echo ""
echo "Monitoring features enabled:"
echo "- Auto-restart every 5 minutes if offline"
echo "- Auto-restart on high memory usage (>85%)"
echo "- Auto-restart if no activity for 10 minutes"
echo "- Log rotation enabled"
echo "- Restart logs saved to ~/bot-restarts.log"
echo ""
echo "To add webhook notifications:"
echo "1. Edit ~/notify-webhook.sh"
echo "2. Add your Discord/Slack webhook URL"
echo ""
echo "Check monitoring status:"
echo "- crontab -l (see scheduled checks)"
echo "- tail ~/bot-restarts.log (see restart history)"
echo "- pm2 monit (live monitoring)"