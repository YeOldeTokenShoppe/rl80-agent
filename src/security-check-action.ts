import { Action, IAgentRuntime, Memory, ActionResult } from '@elizaos/core';

export const securityCheckAction: Action = {
    name: 'SECURITY_CHECK',
    description: 'Provides security reminders and points to ZachXBT',
    similes: ['scam check', 'is it safe', 'security alert', 'zachxbt', 'rug pull'],
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = ['scam', 'safe', 'rug', 'security', 'zachxbt', 'hack'];
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
            const response = `🚨 **Security Check Reminder**

**For Latest Scam Alerts:**
📱 Follow @zachxbt on Telegram: https://t.me/investigations

**Red Flags to Watch:**
• Anonymous teams with no history
• Promises of guaranteed returns
• Pressure to buy quickly  
• Large team token holdings (>20%)
• No liquidity lock or audit
• Fake partnerships

**Before Investing:**
✓ Verify team identities
✓ Check contract audits
✓ Look for liquidity locks
✓ Search project name + "scam"
✓ Check ZachXBT's investigations

**If You Suspect a Scam:**
• Don't panic
• Document everything
• Report to @zachxbt
• Warn the community

Remember: If it seems too good to be true, it probably is. Always DYOR!`;

            if (callback) {
                await callback({
                    text: response,
                    action: 'SECURITY_CHECK'
                });
            }
            
            return {
                success: true,
                data: { type: 'security_check' }
            };
            
        } catch (error) {
            runtime.logger.error('[Security Check] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};