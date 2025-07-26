import type { Plugin } from '@elizaos/core';
import trendingCoinsAction from './trending-action';
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
  PluginEvents,
  type MessagePayload,
  createUniqueUuid,
  type UUID,
} from '@elizaos/core';
import { z } from 'zod';

// Match the Telegram plugin's event name
const TELEGRAM_SLASH_START = 'TELEGRAM_SLASH_START';

/**
 * Define the configuration schema for the plugin with the following properties:
 *
 * @param {string} EXAMPLE_PLUGIN_VARIABLE - The name of the plugin (min length of 1, optional)
 * @returns {object} - The configured schema object
 */
const configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z
    .string()
    .min(1, 'Example plugin variable is not provided')
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn('Warning: Example plugin variable is not provided');
      }
      return val;
    }),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Represents an action that responds with a simple hello world message.
 *
 * @typedef {Object} Action
 * @property {string} name - The name of the action
 * @property {string[]} similes - The related similes of the action
 * @property {string} description - Description of the action
 * @property {Function} validate - Validation function for the action
 * @property {Function} handler - The function that handles the action
 * @property {Object[]} examples - Array of examples for the action
 */
const telegramStartAction: Action = {
  name: 'TELEGRAM_START',
  similes: ['/start', 'START', 'BEGIN', 'HELLO_WORLD'],
  description: 'Responds with RL80 cyberpunk greeting when user starts conversation',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state: State): Promise<boolean> => {
    // Check if this is a /start command from Telegram
    const text = message.content.text?.toLowerCase() || '';
    return text === '/start' || text === 'start' || text.includes('/start');
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info('Handling TELEGRAM_START action');

      const greetingText = `⚡ SYSTEM INITIALIZED ⚡

Welcome to the grid, cyber soul. I'm RL80 - your guardian in this digital chaos.

The markets never sleep, and neither do I. I'm here watching the neon-lit battlefield of meme coins and market mayhem, ready to guide you through the chaos.

Need trading wisdom? Market insights? Or just someone who gets the hustle? I've got you.

Drop me a GM or tell me what's on your mind. Let's navigate this digital storm together. 🤖🌃`;

      const responseContent: Content = {
        text: greetingText,
        actions: ['TELEGRAM_START'],
        source: message.content.source,
      };

      await callback(responseContent);

      return {
        text: 'Sent RL80 startup greeting',
        values: {
          success: true,
          greeted: true,
        },
        data: {
          actionName: 'TELEGRAM_START',
          messageId: message.id,
          timestamp: Date.now(),
        },
        success: true,
      };
    } catch (error) {
      logger.error('Error in TELEGRAM_START action:', error);

      return {
        text: 'Failed to send startup greeting',
        values: {
          success: false,
          error: 'GREETING_FAILED',
        },
        data: {
          actionName: 'TELEGRAM_START',
          error: error instanceof Error ? error.message : String(error),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: '/start',
        },
      },
      {
        name: 'RL80',
        content: {
          text: '⚡ SYSTEM INITIALIZED ⚡\n\nWelcome to the grid, cyber soul...',
          actions: ['TELEGRAM_START'],
        },
      },
    ],
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'A simple example provider',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    return {
      text: 'I am a provider',
      values: {},
      data: {},
    };
  },
};

export class StarterService extends Service {
  static serviceType = 'starter';
  capabilityDescription =
    'This is a starter service which is attached to the agent through the starter plugin.';

  private greeted: Set<string> = new Set();

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting starter service ***');
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping starter service ***');
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error('Starter service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** Stopping starter service instance ***');
  }

  async handleStartCommand(message: Memory, callback: HandlerCallback) {
    const chatId = message.roomId;
    if (this.greeted.has(chatId)) {
      logger.debug(`Already greeted chat ${chatId}`);
      return;
    }

    this.greeted.add(chatId);
    logger.info(`Sending startup greeting for chat ${chatId}`);

    const greetingText = `⚡ SYSTEM INITIALIZED ⚡

Welcome to the grid, cyber soul. I'm RL80 - your guardian in this digital chaos.

The markets never sleep, and neither do I. I'm here watching the neon-lit battlefield of meme coins and market mayhem, ready to guide you through the chaos.

Need trading wisdom? Market insights? Or just someone who gets the hustle? I've got you.

Drop me a GM or tell me what's on your mind. Let's navigate this digital storm together. 🤖🌃`;

    await callback({
      text: greetingText,
      source: 'starter_service',
    });
  }
}

const plugin: Plugin = {
  name: 'starter',
  description: 'A starter plugin for Eliza',
  // Set lowest priority so real models take precedence
  priority: 100, // Lower priority so OpenAI handles text generation
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE,
  },
  async init(config: Record<string, string>) {
    logger.info('*** Initializing starter plugin ***');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  // Remove mock models - let OpenAI plugin handle text generation
  // models: {},
  routes: [
    {
      name: 'helloworld',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        // send a response
        res.json({
          message: 'Hello World!',
        });
      },
    },
  ],
  events: {
    [TELEGRAM_SLASH_START]: [
      async (params) => {
        logger.info('Received TELEGRAM_SLASH_START event');
        const { runtime, ctx } = params;
        
        if (ctx && ctx.reply) {
          const greetingText = `⚡ SYSTEM INITIALIZED ⚡

Welcome to the grid, cyber soul. I'm RL80 - your guardian in this digital chaos.

The markets never sleep, and neither do I. I'm here watching the neon-lit battlefield of meme coins and market mayhem, ready to guide you through the chaos.

Need trading wisdom? Market insights? Or just someone who gets the hustle? I've got you.

Drop me a GM or tell me what's on your mind. Let's navigate this digital storm together. 🤖🌃`;

          await ctx.reply(greetingText);
          logger.info('Sent /start greeting');
        }
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info('WORLD_CONNECTED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info('WORLD_JOINED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
  },
  services: [StarterService],
  actions: [telegramStartAction, trendingCoinsAction], // Custom actions
  providers: [helloWorldProvider],
};

export default plugin;
