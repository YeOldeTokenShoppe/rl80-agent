import { Action, IAgentRuntime, Memory, ActionResult, UUID } from '@elizaos/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

interface MarketAnalysis {
    timestamp: Date;
    summary: string;
    analysis: string;
    topCoins: string[];
    marketData: {
        btc: any;
        eth: any;
        largeCaps: any[];
        trending: any[];
    };
}

interface CMCQuote {
    price: number;
    volume_24h: number;
    volume_change_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    market_cap_dominance: number;
}

export const marketAnalysisAction: Action = {
    name: 'MARKET_ANALYSIS',
    description: 'Generates comprehensive market analysis using real CoinMarketCap data',
    similes: ['market analysis', 'analyze market', 'market report', 'daily analysis'],
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Can be triggered by schedule or user
    },
    
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: any,
        options: any,
        callback: any
    ): Promise<ActionResult> => {
        try {
            runtime.logger.info('[Market Analysis] Starting real market analysis...');
            
            const apiKey = process.env.COINMARKETCAP_API_KEY;
            if (!apiKey) {
                throw new Error('COINMARKETCAP_API_KEY not found in environment');
            }
            
            // Fetch real market data
            const headers = {
                'X-CMC_PRO_API_KEY': apiKey,
                'Accept': 'application/json'
            };
            
            // 1. Get latest listings (top 100 by market cap)
            runtime.logger.info('[Market Analysis] Fetching top cryptocurrencies...');
            const listingsResponse = await axios.get(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
                {
                    headers,
                    params: {
                        start: 1,
                        limit: 100,
                        convert: 'USD',
                        sort: 'market_cap',
                        sort_dir: 'desc'
                    }
                }
            );
            
            const cryptos = listingsResponse.data.data;
            
            // Find BTC and ETH
            const btc = cryptos.find((c: any) => c.symbol === 'BTC');
            const eth = cryptos.find((c: any) => c.symbol === 'ETH');
            
            // Get top 10 large caps (excluding BTC and ETH)
            const largeCaps = cryptos
                .filter((c: any) => c.symbol !== 'BTC' && c.symbol !== 'ETH')
                .slice(0, 10);
            
            // Sort by 24h percent change to get top gainers
            const topGainers = [...cryptos]
                .sort((a: any, b: any) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)
                .slice(0, 10);
            
            // Calculate total market metrics
            const totalMarketCap = cryptos.reduce((sum: number, c: any) => sum + c.quote.USD.market_cap, 0);
            const total24hVolume = cryptos.reduce((sum: number, c: any) => sum + c.quote.USD.volume_24h, 0);
            
            // Format price with appropriate decimals
            const formatPrice = (price: number) => {
                if (price > 1000) return price.toFixed(0);
                if (price > 1) return price.toFixed(2);
                if (price > 0.01) return price.toFixed(4);
                return price.toFixed(6);
            };
            
            // Format market cap/volume
            const formatLargeNumber = (num: number) => {
                if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
                if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
                if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
                return `$${num.toFixed(0)}`;
            };
            
            // Create summary
            const summary = `BTC: $${formatPrice(btc.quote.USD.price)} (${btc.quote.USD.percent_change_24h > 0 ? '+' : ''}${btc.quote.USD.percent_change_24h.toFixed(2)}%) | ETH: $${formatPrice(eth.quote.USD.price)} (${eth.quote.USD.percent_change_24h > 0 ? '+' : ''}${eth.quote.USD.percent_change_24h.toFixed(2)}%) | Total Market Cap: ${formatLargeNumber(totalMarketCap)} | 24h Volume: ${formatLargeNumber(total24hVolume)}`;
            
            // Generate detailed analysis
            const analysis = `📊 **Market Overview - ${new Date().toLocaleDateString()}**

The cryptocurrency market shows a total capitalization of ${formatLargeNumber(totalMarketCap)} with ${formatLargeNumber(total24hVolume)} in 24-hour trading volume.

**Major Cryptocurrencies:**

🔸 **Bitcoin (BTC)**: $${formatPrice(btc.quote.USD.price)}
   • 24h Change: ${btc.quote.USD.percent_change_24h > 0 ? '+' : ''}${btc.quote.USD.percent_change_24h.toFixed(2)}%
   • 7d Change: ${btc.quote.USD.percent_change_7d > 0 ? '+' : ''}${btc.quote.USD.percent_change_7d.toFixed(2)}%
   • Market Dominance: ${btc.quote.USD.market_cap_dominance.toFixed(2)}%
   • 24h Volume: ${formatLargeNumber(btc.quote.USD.volume_24h)}

🔸 **Ethereum (ETH)**: $${formatPrice(eth.quote.USD.price)}
   • 24h Change: ${eth.quote.USD.percent_change_24h > 0 ? '+' : ''}${eth.quote.USD.percent_change_24h.toFixed(2)}%
   • 7d Change: ${eth.quote.USD.percent_change_7d > 0 ? '+' : ''}${eth.quote.USD.percent_change_7d.toFixed(2)}%
   • Market Dominance: ${eth.quote.USD.market_cap_dominance.toFixed(2)}%
   • 24h Volume: ${formatLargeNumber(eth.quote.USD.volume_24h)}

**Top Large Cap Altcoins:**
${largeCaps.slice(0, 5).map((coin: any) => 
    `• **${coin.name} (${coin.symbol})**: $${formatPrice(coin.quote.USD.price)} (${coin.quote.USD.percent_change_24h > 0 ? '+' : ''}${coin.quote.USD.percent_change_24h.toFixed(2)}%)`
).join('\n')}

**Market Sentiment:**
${(() => {
    const avgChange = cryptos.slice(0, 20).reduce((sum: number, c: any) => sum + c.quote.USD.percent_change_24h, 0) / 20;
    if (avgChange > 5) return '🟢 Strong Bullish - Market showing significant upward momentum';
    if (avgChange > 2) return '🟢 Bullish - Positive sentiment across major assets';
    if (avgChange > -2) return '🟡 Neutral - Mixed signals with sideways movement';
    if (avgChange > -5) return '🔴 Bearish - Negative pressure on most assets';
    return '🔴 Strong Bearish - Significant selling pressure detected';
})()}

**Top 5 Trending (24h Gainers):**
${topGainers.slice(0, 5).map((coin: any, i: number) => 
    `${i + 1}. **${coin.name} (${coin.symbol})**: +${coin.quote.USD.percent_change_24h.toFixed(2)}% • Price: $${formatPrice(coin.quote.USD.price)}`
).join('\n')}

*Data sourced from CoinMarketCap • Updated: ${new Date().toLocaleTimeString()}*`;
            
            // Format top coins for display
            const topCoins = topGainers.slice(0, 10).map((coin: any) => 
                `${coin.symbol} (+${coin.quote.USD.percent_change_24h.toFixed(1)}%)`
            );
            
            // Create analysis object
            const marketAnalysis: MarketAnalysis = {
                timestamp: new Date(),
                summary,
                analysis,
                topCoins,
                marketData: {
                    btc: btc.quote.USD,
                    eth: eth.quote.USD,
                    largeCaps: largeCaps.map((c: any) => ({
                        symbol: c.symbol,
                        name: c.name,
                        price: c.quote.USD.price,
                        percent_change_24h: c.quote.USD.percent_change_24h,
                        market_cap: c.quote.USD.market_cap
                    })),
                    trending: topGainers.slice(0, 10).map((c: any) => ({
                        symbol: c.symbol,
                        name: c.name,
                        price: c.quote.USD.price,
                        percent_change_24h: c.quote.USD.percent_change_24h,
                        volume_24h: c.quote.USD.volume_24h
                    }))
                }
            };
            
            // Save to file for website access
            const outputDir = path.join(process.cwd(), 'data', 'market-reports');
            await fs.mkdir(outputDir, { recursive: true });
            
            const filename = `market-analysis-${new Date().toISOString().split('T')[0]}.json`;
            await fs.writeFile(
                path.join(outputDir, filename),
                JSON.stringify(marketAnalysis, null, 2)
            );
            
            // Save as latest for easy access
            await fs.writeFile(
                path.join(outputDir, 'latest.json'),
                JSON.stringify(marketAnalysis, null, 2)
            );
            
            runtime.logger.info('[Market Analysis] Real market analysis completed and saved');
            
            if (callback) {
                await callback({
                    text: analysis,
                    action: 'MARKET_ANALYSIS'
                });
            }
            
            return {
                success: true,
                data: marketAnalysis
            };
            
        } catch (error) {
            runtime.logger.error('[Market Analysis] Error:', error);
            
            // If API fails, fall back to the original static analysis
            if (error.response?.status === 401) {
                runtime.logger.error('[Market Analysis] Invalid API key. Please check COINMARKETCAP_API_KEY');
            }
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch market data'
            };
        }
    }
};

// Keep the cached analysis action the same
export const getCachedMarketAnalysisAction: Action = {
    name: 'GET_CACHED_MARKET_ANALYSIS',
    description: 'Retrieves the latest cached market analysis',
    similes: ['market summary', 'whats the market doing', 'market overview', 'crypto market'],
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ['market', 'summary', 'overview', 'analysis', 'crypto'];
        const text = message.content.text || '';
        return keywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
    },
    
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: any,
        options: any,
        callback: any
    ): Promise<ActionResult> => {
        try {
            // Try to read cached analysis
            const analysisPath = path.join(process.cwd(), 'data', 'market-reports', 'latest.json');
            
            try {
                const data = await fs.readFile(analysisPath, 'utf-8');
                const cachedAnalysis = JSON.parse(data) as MarketAnalysis;
                
                const hoursSinceAnalysis = (Date.now() - new Date(cachedAnalysis.timestamp).getTime()) / (1000 * 60 * 60);
                
                // If analysis is older than 12 hours, generate new one
                if (hoursSinceAnalysis > 12) {
                    runtime.logger.info('[Market Analysis] Cached analysis is stale, generating new one...');
                    return await marketAnalysisAction.handler(runtime, message, state, options, callback) as ActionResult;
                }
                
                // Return cached analysis
                const response = `${cachedAnalysis.analysis}\n\n⏰ *Updated ${Math.floor(hoursSinceAnalysis)} hours ago*`;
                
                if (callback) {
                    await callback({
                        text: response,
                        action: 'GET_CACHED_MARKET_ANALYSIS'
                    });
                }
                
                return {
                    success: true,
                    data: cachedAnalysis
                };
                
            } catch (fileError) {
                // No cached analysis, generate new one
                runtime.logger.info('[Market Analysis] No cached analysis found, generating new one...');
                return await marketAnalysisAction.handler(runtime, message, state, options, callback) as ActionResult;
            }
            
        } catch (error) {
            runtime.logger.error('[Market Analysis] Error retrieving analysis:', error);
            
            if (callback) {
                await callback({
                    text: 'Sorry, I encountered an error retrieving the market analysis. Let me generate a fresh report for you.',
                    action: 'GET_CACHED_MARKET_ANALYSIS'
                });
            }
            
            return await marketAnalysisAction.handler(runtime, message, state, options, callback) as ActionResult;
        }
    }
};