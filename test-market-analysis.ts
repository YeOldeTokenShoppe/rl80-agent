#!/usr/bin/env bun

import { marketAnalysisAction } from './src/market-analysis-action';
import { zachxbtFetcherAction } from './src/zachxbt-fetcher';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock runtime for testing
const mockRuntime = {
  logger: {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
    debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
  }
};

// Mock message
const mockMessage = {
  id: `test-${Date.now()}`,
  userId: 'test-user',
  roomId: 'test-room',
  content: { text: 'Run market analysis' },
  timestamp: new Date().toISOString()
};

// Mock state
const mockState = { values: {}, data: {}, text: '' };

// Mock callback
const mockCallback = async (content: any) => {
  console.log('\n=== CALLBACK OUTPUT ===');
  console.log(content.text || content);
  console.log('======================\n');
};

async function testMarketAnalysis() {
  console.log('🚀 Testing Market Analysis Action...\n');
  
  try {
    // Run market analysis
    const result = await marketAnalysisAction.handler(
      mockRuntime as any,
      mockMessage as any,
      mockState,
      {},
      mockCallback
    );
    
    console.log('✅ Market Analysis Result:', result.success ? 'SUCCESS' : 'FAILED');
    
    // Check if files were created
    const marketReportPath = path.join(process.cwd(), 'data', 'market-reports', 'latest.json');
    try {
      const data = await fs.readFile(marketReportPath, 'utf-8');
      const report = JSON.parse(data);
      console.log('\n📊 Market Report Created:');
      console.log(`- Timestamp: ${report.timestamp}`);
      console.log(`- Summary: ${report.summary}`);
      console.log(`- Top Coins: ${report.topCoins.length} entries`);
      console.log(`- Analysis length: ${report.analysis.length} characters`);
    } catch (e) {
      console.log('❌ Could not read market report file');
    }
    
  } catch (error) {
    console.error('❌ Error testing market analysis:', error);
  }
}

async function testZachXBT() {
  console.log('\n🚀 Testing ZachXBT Fetcher Action...\n');
  
  try {
    // Run ZachXBT fetcher
    const result = await zachxbtFetcherAction.handler(
      mockRuntime as any,
      mockMessage as any,
      mockState,
      {},
      mockCallback
    );
    
    console.log('✅ ZachXBT Fetcher Result:', result.success ? 'SUCCESS' : 'FAILED');
    
    // Check if files were created
    const alertsPath = path.join(process.cwd(), 'data', 'scam-alerts', 'zachxbt-posts.json');
    try {
      const data = await fs.readFile(alertsPath, 'utf-8');
      const alerts = JSON.parse(data);
      console.log('\n🚨 Scam Alerts Created:');
      console.log(`- Timestamp: ${alerts.timestamp}`);
      console.log(`- Alert Count: ${alerts.alertCount}`);
      console.log(`- Alerts: ${alerts.alerts.length} entries`);
    } catch (e) {
      console.log('❌ Could not read scam alerts file');
    }
    
  } catch (error) {
    console.error('❌ Error testing ZachXBT fetcher:', error);
  }
}

async function testAPIEndpoints() {
  console.log('\n🚀 Testing API Endpoints (simulated)...\n');
  
  // Import the routes from plugin
  const plugin = await import('./src/plugin');
  const routes = plugin.default.routes || [];
  
  console.log(`📍 Found ${routes.length} API routes:`);
  routes.forEach(route => {
    console.log(`- ${route.type} ${route.path} (${route.name})`);
  });
}

// Run all tests
async function runTests() {
  console.log('=' .repeat(50));
  console.log('🧪 RL80 Market Analysis Test Suite');
  console.log('=' .repeat(50));
  
  await testMarketAnalysis();
  await testZachXBT();
  await testAPIEndpoints();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed!');
  console.log('=' .repeat(50));
  
  console.log('\n📌 Next steps:');
  console.log('1. Check the data/market-reports/ directory for generated files');
  console.log('2. Check the data/scam-alerts/ directory for alert files');
  console.log('3. Open market-analysis-demo.html in a browser to see the dashboard');
  console.log('4. When the server runs properly, the API will serve data from these files');
}

runTests().catch(console.error);