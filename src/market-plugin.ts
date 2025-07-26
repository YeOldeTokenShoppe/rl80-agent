import { Plugin, Action, type IAgentRuntime, type Memory, type State, type HandlerCallback, logger, type Content } from '@elizaos/core';
import axios from 'axios';

/**
 * Example market data plugin that fetches real-time crypto prices
 * You'll need to sign up for a free API key from CoinGecko or CoinMarketCap
 */

const fetchCryptoPrice: Action = {
  name: 'FETCH_CRYPTO_PRICE',
  similes: ['price', 'current price', 'how much', 'what is the price'],
  description: 'Fetches current cryptocurrency prices',
  
  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('price') || text.includes('how much') || text.includes('current');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      // Example using CoinGecko's free API (no key required for basic usage)
      // For production, use your own API key and endpoint
      const coins = ['bitcoin', 'ethereum', 'solana'];
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(',')}&vs_currencies=usd`
      );

      const prices = response.data;
      const priceText = Object.entries(prices)
        .map(([coin, data]: [string, any]) => `${coin}: $${data.usd}`)
        .join(', ');

      const responseContent: Content = {
        text: `Current prices from the matrix: ${priceText}. Remember, cyber soul - these digits change faster than a corrupted hologram. 📊⚡`,
        source: 'market_plugin',
      };

      await callback(responseContent);

      return {
        text: 'Fetched crypto prices',
        values: { prices },
        success: true,
      };
    } catch (error) {
      logger.error('Error fetching crypto prices:', error);
      
      await callback({
        text: "The price feed's glitching out. Try checking your favorite chart app instead. 🌃",
        error: true,
      });

      return {
        text: 'Failed to fetch prices',
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{user1}}',
        content: { text: "What's the current price of Bitcoin?" },
      },
      {
        name: 'RL80',
        content: { 
          text: 'Let me tap into the price matrix for you...',
          actions: ['FETCH_CRYPTO_PRICE'],
        },
      },
    ],
  ],
};

export const marketPlugin: Plugin = {
  name: 'market-data',
  description: 'Provides real-time market data for crypto assets',
  actions: [fetchCryptoPrice],
};

export default marketPlugin;