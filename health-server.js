const http = require('http');
const { exec } = require('child_process');

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check PM2 status
    exec('pm2 jlist', (error, stdout, stderr) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'PM2 not running' }));
        return;
      }

      try {
        const processes = JSON.parse(stdout);
        const rl80Bot = processes.find(p => p.name === 'rl80-bot');
        
        if (rl80Bot && rl80Bot.pm2_env.status === 'online') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'healthy',
            bot: 'online',
            uptime: rl80Bot.pm2_env.pm_uptime,
            memory: rl80Bot.monit.memory,
            cpu: rl80Bot.monit.cpu
          }));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'unhealthy', bot: 'offline' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Failed to parse PM2 data' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
});