import { Service, IAgentRuntime, logger } from '@elizaos/core';
import { marketAnalysisAction } from './market-analysis-action';
import { zachxbtFetcherAction } from './zachxbt-fetcher';
import * as cron from 'node-cron';

export class SchedulerService extends Service {
    static serviceType = 'scheduler';
    capabilityDescription = 'Schedules and runs automated tasks like market analysis and scam monitoring';
    
    private tasks: cron.ScheduledTask[] = [];
    
    constructor(runtime: IAgentRuntime) {
        super(runtime);
    }
    
    static async start(runtime: IAgentRuntime) {
        logger.info('*** Starting scheduler service ***');
        const service = new SchedulerService(runtime);
        await service.initialize();
        return service;
    }
    
    static async stop(runtime: IAgentRuntime) {
        logger.info('*** Stopping scheduler service ***');
        const service = runtime.getService(SchedulerService.serviceType);
        if (!service) {
            throw new Error('Scheduler service not found');
        }
        await (service as SchedulerService).stop();
    }
    
    async initialize() {
        logger.info('[Scheduler] Initializing scheduled tasks...');
        
        // Schedule market analysis at 8 AM and 8 PM UTC
        const marketAnalysisTask = cron.schedule('0 8,20 * * *', async () => {
            logger.info('[Scheduler] Running scheduled market analysis...');
            try {
                // Create a dummy message for the action
                const dummyMessage = {
                    id: `scheduled-${Date.now()}`,
                    userId: 'scheduler',
                    roomId: 'scheduler',
                    content: { text: 'Scheduled market analysis' },
                    timestamp: new Date().toISOString()
                };
                
                await marketAnalysisAction.handler(
                    this.runtime,
                    dummyMessage as any,
                    { values: {}, data: {}, text: '' },
                    {},
                    undefined
                );
                
                logger.info('[Scheduler] Market analysis completed successfully');
            } catch (error) {
                logger.error('[Scheduler] Error running market analysis:', error);
            }
        }, {
            scheduled: true,
            timezone: 'UTC'
        });
        
        this.tasks.push(marketAnalysisTask);
        
        // Schedule ZachXBT monitoring at 9 AM and 9 PM UTC (1 hour after market analysis)
        const zachxbtTask = cron.schedule('0 9,21 * * *', async () => {
            logger.info('[Scheduler] Running scheduled ZachXBT monitoring...');
            try {
                const dummyMessage = {
                    id: `scheduled-zachxbt-${Date.now()}`,
                    userId: 'scheduler',
                    roomId: 'scheduler',
                    content: { text: 'Scheduled ZachXBT check' },
                    timestamp: new Date().toISOString()
                };
                
                await zachxbtFetcherAction.handler(
                    this.runtime,
                    dummyMessage as any,
                    { values: {}, data: {}, text: '' },
                    {},
                    undefined
                );
                
                logger.info('[Scheduler] ZachXBT monitoring completed successfully');
            } catch (error) {
                logger.error('[Scheduler] Error running ZachXBT monitoring:', error);
            }
        }, {
            scheduled: true,
            timezone: 'UTC'
        });
        
        this.tasks.push(zachxbtTask);
        
        // Run both tasks immediately on startup
        logger.info('[Scheduler] Running initial market analysis and ZachXBT check...');
        
        try {
            const startupMessage = {
                id: `startup-${Date.now()}`,
                userId: 'scheduler',
                roomId: 'scheduler',
                content: { text: 'Startup analysis' },
                timestamp: new Date().toISOString()
            };
            
            await marketAnalysisAction.handler(
                this.runtime,
                startupMessage as any,
                { values: {}, data: {}, text: '' },
                {},
                undefined
            );
            
            await zachxbtFetcherAction.handler(
                this.runtime,
                startupMessage as any,
                { values: {}, data: {}, text: '' },
                {},
                undefined
            );
            
            logger.info('[Scheduler] Initial tasks completed');
        } catch (error) {
            logger.error('[Scheduler] Error running initial tasks:', error);
        }
        
        logger.info('[Scheduler] Scheduled tasks initialized:');
        logger.info('- Market Analysis: 8:00 AM and 8:00 PM UTC');
        logger.info('- ZachXBT Monitoring: 9:00 AM and 9:00 PM UTC');
    }
    
    async stop() {
        logger.info('[Scheduler] Stopping all scheduled tasks...');
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
    }
}