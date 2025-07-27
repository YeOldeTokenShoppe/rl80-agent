import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

export const apiRouter = Router();

// CORS middleware for local development
apiRouter.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Market analysis endpoint
apiRouter.get('/market-analysis', async (req, res) => {
    try {
        const analysisPath = path.join(process.cwd(), 'data', 'market-reports', 'latest.json');
        const data = await fs.readFile(analysisPath, 'utf-8');
        const analysis = JSON.parse(data);
        
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        // Return placeholder data if no analysis exists yet
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

// ZachXBT alerts endpoint
apiRouter.get('/scam-alerts', async (req, res) => {
    try {
        const alertsPath = path.join(process.cwd(), 'data', 'scam-alerts', 'zachxbt-posts.json');
        const data = await fs.readFile(alertsPath, 'utf-8');
        const alerts = JSON.parse(data);
        
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        // Return empty alerts if none exist yet
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

// Combined dashboard data endpoint
apiRouter.get('/dashboard', async (req, res) => {
    try {
        const [marketData, alertData] = await Promise.all([
            fs.readFile(path.join(process.cwd(), 'data', 'market-reports', 'latest.json'), 'utf-8')
                .then(data => JSON.parse(data))
                .catch(() => null),
            fs.readFile(path.join(process.cwd(), 'data', 'scam-alerts', 'zachxbt-posts.json'), 'utf-8')
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

// Health check endpoint
apiRouter.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});