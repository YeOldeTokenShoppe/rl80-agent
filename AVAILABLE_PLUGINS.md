# ElizaOS Available Plugins

## Core Plugins (Already Installed)
- **@elizaos/plugin-bootstrap** - Core event handlers, services, actions, and providers
- **@elizaos/plugin-sql** - PostgreSQL database adapter with Drizzle ORM
- **@elizaos/plugin-openai** - OpenAI GPT models integration
- **@elizaos/plugin-discord** - Discord bot integration
- **@elizaos/plugin-telegram** - Telegram bot integration
- **@elizaos/plugin-twitter** - Twitter/X posting & monitoring

## AI Model Providers
- **@elizaos/plugin-anthropic** - Claude models integration
- **@elizaos/plugin-groq** - Fast inference with Llama, Mixtral
- **@elizaos/plugin-redpill** - RedPill's model aggregator integration

## Market Data & Trading
- **@elizaos/plugin-coinmarketcap** - Real-time cryptocurrency prices
- **@elizaos/plugin-birdeye** - DeFi and token analytics through Birdeye's API with real-time blockchain data across multiple networks
- **@elizaos/plugin-zapper** - Portfolio tracking, DeFi analytics across 50+ networks
- **@elizaos/plugin-hyperliquid** - Hyperliquid DEX trading
- **@elizaos/plugin-grix** - Asset prices, option prices, and trading signals
- **@elizaos/plugin-squid-router** - Cross-chain token swaps

## Blockchain Integration
- **@elizaos/plugin-solana** - Solana blockchain operations
- **@elizaos/plugin-evm** - Ethereum & EVM chains
- **@elizaos/plugin-sui** - Sui network operations
- **@elizaos/plugin-starknet** - Starknet blockchain operations
- **@elizaos/plugin-ton** - TON blockchain operations
- **@elizaos/plugin-allora** - Allora Network inference topics
- **@elizaos/plugin-iq6900** - IQ6900 on-chain inscription

## Communication & Social
- **@elizaos/plugin-whatsapp** - WhatsApp Cloud API integration
- **@elizaos/plugin-web** - Web UI for agent interaction
- **@elizaos/plugin-rest** - REST API endpoints

## Specialized Features
- **@elizaos/plugin-knowledge** - Knowledge management
- **@elizaos/plugin-mcp** - Model Context Protocol integration
- **@elizaos/plugin-intiface** - Hardware device control via Intiface/Buttplug
- **plugin-desearch** - AI-driven search capabilities
- **@elizaos/plugin-web-search** - Web search functionality
- **@elizaos/plugin-image** - Image generation & analysis

## Installation Examples

```bash
# Install a plugin
bun add @elizaos/plugin-coinmarketcap

# Add multiple plugins
bun add @elizaos/plugin-web-search @elizaos/plugin-coinmarketcap

# For Solana/crypto functionality
bun add @elizaos/plugin-solana @elizaos/plugin-coinmarketcap
```

## Usage

After installing, add the plugin to your character configuration:

```typescript
// src/character.ts
export const character: Character = {
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',
    '@elizaos/plugin-telegram',
    '@elizaos/plugin-coinmarketcap', // Add new plugin here
    // ... other plugins
  ],
  // ... rest of configuration
};
```

## Environment Variables

Some plugins require additional configuration:

```bash
# CoinMarketCap
COINMARKETCAP_API_KEY=your-api-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=your-api-key

# Groq
GROQ_API_KEY=your-api-key

# Solana
SOLANA_PUBLIC_KEY=your-public-key
SOLANA_PRIVATE_KEY=your-private-key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# EVM chains
EVM_PUBLIC_KEY=your-public-key
EVM_PRIVATE_KEY=your-private-key
```

## Recommended Plugins for RL80

Given RL80's crypto/trading focus, consider:

1. **@elizaos/plugin-coinmarketcap** - For real-time crypto prices
2. **@elizaos/plugin-web-search** - To search for market news
3. **@elizaos/plugin-zapper** - For DeFi analytics
4. **@elizaos/plugin-solana** - If you want on-chain capabilities

## Plugin Registry

For the latest plugins, check:
- https://github.com/elizaos-plugins/registry
- npm search @elizaos/plugin-