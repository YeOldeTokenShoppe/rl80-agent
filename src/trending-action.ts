import { Action, type IAgentRuntime, type Memory, type State, type HandlerCallback, logger, type Content, type ActionResult } from '@elizaos/core';
import axios from 'axios';

/**
 * Custom action to fetch trending cryptocurrencies from CoinMarketCap
 */
export const trendingCoinsAction: Action = {
  name: 'GET_TRENDING_COINS',
  similes: ['trending', 'hot coins', 'what\'s trending', 'trending crypto', 'popular coins', 'gainers', 'movers'],
  description: 'Fetches trending cryptocurrencies from CoinMarketCap',
  
  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('trending') || text.includes('hot') || text.includes('gainers') || text.includes('movers');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const apiKey = runtime.getSetting('COINMARKETCAP_API_KEY') || process.env.COINMARKETCAP_API_KEY;
      
      if (!apiKey) {
        await callback({
          text: "My price feed's offline, cyber soul. Can't tap into the trending matrix right now. 🌃",
          error: true,
        });
        return {
          text: 'CoinMarketCap API key not configured',
          success: false,
        };
      }

      // Fetch top gainers in the last 24h
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
        },
        params: {
          start: '1',
          limit: '10',
          sort: 'percent_change_24h',
          sort_dir: 'desc',
          convert: 'USD',
        },
      });

      const trendingCoins = response.data.data.slice(0, 5).map((coin: any) => ({
        name: coin.name,
        symbol: coin.symbol,
        price: coin.quote.USD.price.toFixed(coin.quote.USD.price < 1 ? 4 : 2),
        change24h: coin.quote.USD.percent_change_24h.toFixed(2),
      }));

      let responseText = "⚡ TRENDING IN THE DIGITAL MATRIX ⚡\\n\\n";
      responseText += "Top movers lighting up the neon charts:\\n\\n";
      
      trendingCoins.forEach((coin: any, index: number) => {
        const emoji = coin.change24h > 20 ? '🚀' : coin.change24h > 10 ? '🔥' : '📈';
        responseText += `${index + 1}. ${coin.name} (${coin.symbol}) ${emoji}\\n`;
        responseText += `   Price: $${coin.price} | 24h: +${coin.change24h}%\\n\\n`;
      });

      responseText += "Remember, what pumps fast can dump faster. The matrix rewards the patient, not the greedy. 🕶️";

      await callback({
        text: responseText,
        source: 'trending_action',
      });

      return {
        text: 'Fetched trending coins',
        values: { trendingCoins },
        success: true,
      };
    } catch (error) {
      logger.error('Error fetching trending coins:', error);
      
      await callback({
        text: "The trending feed's glitching out. These digital streets are unpredictable tonight. Try again in a few. 🌃",
        error: true,
      });

      return {
        text: 'Failed to fetch trending coins',
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{user1}}',
        content: { text: "What coins are trending today?" },
      },
      {
        name: 'RL80',
        content: { 
          text: 'Let me scan the digital horizon for what\'s hot...',
          actions: ['GET_TRENDING_COINS'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: { text: "Show me the top gainers" },
      },
      {
        name: 'RL80',
        content: { 
          text: 'Tapping into the matrix to see who\'s winning today...',
          actions: ['GET_TRENDING_COINS'],
        },
      },
    ],
  ],
};

export default trendingCoinsAction;