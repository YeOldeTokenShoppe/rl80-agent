# ElizaOS Troubleshooting Guide

## Common Commands

### Kill All ElizaOS Processes

```bash
# Kill all hanging ElizaOS processes
pkill -f elizaos
pkill -f "bun.*elizaos"

# Kill all bun processes (more aggressive)
pkill -f bun

# Check if any processes are still running
ps aux | grep -E "(eliza|bun)" | grep -v grep
```

### Clean Start Procedure

```bash
# 1. Kill all processes
pkill -f elizaos

# 2. Clear any lock files or temporary data
rm -rf .eliza/locks/*
rm -rf .eliza/tmp/*

# 3. Clear logs (optional)
rm -rf .eliza/logs/*

# 4. Start fresh
bun run elizaos start
```

### Check Bot Status

```bash
# Check if bot is running
ps aux | grep elizaos | grep -v grep

# Check recent logs
tail -f .eliza/logs/latest.log

# Check for errors in real-time
bun run elizaos start 2>&1 | grep -i error
```

### Debug Telegram Bot Issues

```bash
# Start with debug logging
LOG_LEVEL=debug bun run elizaos start

# Test Telegram connection only
LOG_LEVEL=debug bun run elizaos start 2>&1 | grep -i telegram

# Check if Telegram token is set
echo $TELEGRAM_BOT_TOKEN
grep TELEGRAM_BOT_TOKEN .env
```

### Common Issues & Solutions

#### Bot Not Responding to /start

1. Check if the bot token is correct:
```bash
# Verify token in .env
grep TELEGRAM_BOT_TOKEN .env

# Also check character.ts for hardcoded tokens
grep -n "TELEGRAM_BOT_TOKEN" src/character.ts
```

2. Ensure Telegram plugin is enabled:
```bash
# Check if plugin is in package.json
grep "@elizaos/plugin-telegram" package.json

# Verify it's installed
ls node_modules/@elizaos/plugin-telegram
```

3. Test with a minimal config:
```bash
# Create a test character with only Telegram
ENABLE_DISCORD=false ENABLE_TWITTER=false bun run elizaos start
```

#### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process using the port
kill -9 <PID>

# Or use a different port
PORT=3001 bun run elizaos start
```

#### Database Issues

```bash
# Reset database (WARNING: This will delete all data)
rm -rf .eliza/.elizadb

# Start fresh (will create new database)
bun run elizaos start
```

#### Memory Issues

```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" bun run elizaos start

# Monitor memory usage
top -pid $(pgrep -f elizaos)
```

### Useful Monitoring Commands

```bash
# Watch logs in real-time
tail -f .eliza/logs/*.log

# Monitor all ElizaOS activity
watch -n 1 'ps aux | grep elizaos | grep -v grep'

# Check system resources
htop

# Network connections (to verify bot is connected)
netstat -an | grep 443  # Telegram uses HTTPS
```

### Quick Restart Script

Create a file called `restart.sh`:

```bash
#!/bin/bash
echo "Stopping all ElizaOS processes..."
pkill -f elizaos
sleep 2

echo "Cleaning up..."
rm -rf .eliza/locks/*
rm -rf .eliza/tmp/*

echo "Starting ElizaOS..."
LOG_LEVEL=info bun run elizaos start
```

Make it executable:
```bash
chmod +x restart.sh
./restart.sh
```

### Test Telegram Bot Manually

```bash
# Test bot webhook
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe

# Get updates
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates

# Set webhook (if needed)
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=
```

### Environment Variables Check

```bash
# List all ElizaOS-related env vars
env | grep -E "(ELIZA|TELEGRAM|DISCORD|OPENAI)"

# Source .env file manually
export $(cat .env | grep -v '^#' | xargs)
```

### Emergency Recovery

If nothing else works:

```bash
# 1. Full cleanup
pkill -9 -f elizaos
pkill -9 -f bun
rm -rf .eliza
rm -rf node_modules
rm bun.lockb

# 2. Reinstall
bun install

# 3. Start with minimal config
LOG_LEVEL=debug CLIENTS=telegram bun run elizaos start
```

## Tips

- Always check logs first: `.eliza/logs/`
- Use `LOG_LEVEL=debug` for detailed output
- Start with one client at a time when debugging
- Keep your bot tokens secure and never commit them
- Use `screen` or `tmux` for persistent sessions
- Consider using PM2 for production deployments

## Getting Help

If issues persist:
1. Check the logs in `.eliza/logs/`
2. Run with `LOG_LEVEL=debug`
3. Try with a minimal configuration
4. Check the ElizaOS documentation
5. Report issues with full error logs