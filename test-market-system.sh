#!/bin/bash

echo "🚀 Testing RL80 Market Intelligence System"
echo "========================================="

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/market-reports
mkdir -p data/scam-alerts

echo ""
echo "📊 To test the system:"
echo "1. Start the bot: bun run start"
echo ""
echo "2. In Telegram/Discord, try these commands:"
echo "   - 'market analysis' - Get latest market report"
echo "   - 'scam check' - Get security alerts"
echo "   - 'trending' - See top gainers"
echo ""
echo "3. View the web dashboard:"
echo "   - Start a local server: python3 -m http.server 8080"
echo "   - Open: http://localhost:8080/market-analysis-demo.html"
echo ""
echo "4. The system will automatically:"
echo "   - Run market analysis at 8 AM and 8 PM UTC"
echo "   - Check ZachXBT alerts at 9 AM and 9 PM UTC"
echo "   - Save data to JSON files for the website"
echo ""
echo "API endpoints available at:"
echo "   - http://localhost:3000/api/market-analysis"
echo "   - http://localhost:3000/api/scam-alerts"
echo "   - http://localhost:3000/api/dashboard"
echo ""

# Make the script executable
chmod +x test-market-system.sh