import { Action, IAgentRuntime, Memory, ActionResult } from '@elizaos/core';

export const marketSummaryAction: Action = {
    name: 'MARKET_SUMMARY',
    description: 'Provides a market summary based on current knowledge',
    similes: ['market summary', 'market overview', 'whats the market doing', 'market analysis'],
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ['market', 'summary', 'overview', 'analysis'];
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
            // Simple market summary without external API calls
            const response = `📊 **Market Overview**

Based on recent trends:

**Crypto Market Status:**
• Bitcoin holding key support levels
• Altcoins showing mixed performance  
• DeFi sector experiencing rotation
• Meme coins remain volatile

**Key Factors:**
• Macro economic data impacting sentiment
• Institutional interest steady
• Regulatory clarity improving in some regions

**Security Reminder:**
Always DYOR and verify project legitimacy. Check @zachxbt on Telegram (https://t.me/investigations) for latest scam alerts.

*Note: For real-time prices, ask about specific tokens.*`;

            if (callback) {
                await callback({
                    text: response,
                    action: 'MARKET_SUMMARY'
                });
            }
            
            return {
                success: true,
                data: { type: 'market_summary' }
            };
            
        } catch (error) {
            runtime.logger.error('[Market Summary] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};