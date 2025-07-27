const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 8081;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files
app.use(express.static('.'));

// API endpoint for dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const [marketData, alertData] = await Promise.all([
      fs.readFile(path.join(__dirname, 'data', 'market-reports', 'latest.json'), 'utf-8')
        .then(data => JSON.parse(data))
        .catch(() => null),
      fs.readFile(path.join(__dirname, 'data', 'scam-alerts', 'zachxbt-posts.json'), 'utf-8')
        .then(data => JSON.parse(data))
        .catch(() => null)
    ]);
    
    res.json({
      success: true,
      data: {
        market: marketData || {
          timestamp: new Date().toISOString(),
          summary: 'Market analysis pending...',
          analysis: 'Next update at 8 AM/PM UTC',
          topCoins: []
        },
        alerts: alertData || {
          timestamp: new Date().toISOString(),
          alertCount: 0,
          alerts: []
        },
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// API endpoint for market analysis
app.get('/api/market-analysis', async (req, res) => {
  try {
    const analysisPath = path.join(__dirname, 'data', 'market-reports', 'latest.json');
    const data = await fs.readFile(analysisPath, 'utf-8');
    const analysis = JSON.parse(data);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        summary: 'Market analysis will be available after the next scheduled update',
        analysis: 'The bot runs comprehensive market analysis twice daily at 8 AM and 8 PM UTC. Check back soon!',
        topCoins: []
      }
    });
  }
});

// API endpoint for scam alerts
app.get('/api/scam-alerts', async (req, res) => {
  try {
    const alertsPath = path.join(__dirname, 'data', 'scam-alerts', 'zachxbt-posts.json');
    const data = await fs.readFile(alertsPath, 'utf-8');
    const alerts = JSON.parse(data);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        source: 'ZachXBT Telegram',
        alertCount: 0,
        alerts: []
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/market-analysis-demo.html`);
  console.log(`\n📍 API Endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/dashboard`);
  console.log(`   - http://localhost:${PORT}/api/market-analysis`);
  console.log(`   - http://localhost:${PORT}/api/scam-alerts`);
  console.log(`\nPress Ctrl+C to stop the server`);
});