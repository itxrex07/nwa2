# HyperWa Bot v3.0.0

Advanced modular WhatsApp userbot with Telegram integration, AI capabilities, and production-ready deployment.

## Quick Deploy

### Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/HyperWa)

### Deploy to Koyeb

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/YOUR_USERNAME/HyperWa&branch=main&name=hyperwa-bot)

## Features

- Advanced WhatsApp userbot with multi-file authentication
- Telegram bridge for message syncing
- AI-powered natural language processing with Gemini
- Modular command system with hot-reload
- MongoDB persistence for sessions and data
- Keep-alive mechanism for 24/7 operation
- Production-ready with health checks
- Rate limiting and security features
- Media processing and conversion
- Group management tools
- Weather, translation, and utility commands

## Anti-Sleep Mechanism

This bot includes a robust keep-alive system that prevents sleeping on free-tier hosting:

- Express web server with status page
- Self-ping every 5 minutes
- Health check endpoints for monitoring
- Automatic platform detection (Render/Koyeb)
- Beautiful status dashboard

## Quick Start

1. Clone this repository
2. Install dependencies: `npm install`
3. Configure environment variables (see below)
4. Run: `npm start`

## Environment Variables

Required:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=hyperwa
NODE_ENV=production
```

Optional:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_weather_api_key
```

## Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Render Deployment

1. Click "Deploy to Render" button above
2. Connect your GitHub account
3. Set required environment variables
4. Deploy

### Koyeb Deployment

1. Click "Deploy to Koyeb" button above
2. Connect your repository
3. Set environment variables
4. Deploy

## Monitoring

After deployment, access your bot status at:

- Render: `https://your-app-name.onrender.com`
- Koyeb: `https://your-app-name.koyeb.app`

Health check endpoint: `/health`

## Project Structure

```
HyperWa/
├── core/               # Core bot functionality
│   ├── bot.js         # Main bot instance
│   ├── message-handler.js
│   ├── module-loader.js
│   └── store.js       # Enhanced message store
├── modules/           # Command modules
│   ├── core.js       # System commands
│   ├── gemini.js     # AI features
│   ├── converter.js  # Media conversion
│   ├── downloader.js # Social media downloads
│   └── ...
├── telegram/          # Telegram bridge
├── utils/            # Utilities
├── keep-alive.js     # Anti-sleep server
├── config.js         # Configuration
└── index.js          # Entry point
```

## Available Commands

- `.help` - Show all commands
- `.ping` - Check bot response time
- `.status` - Bot statistics
- `.ai <message>` - Chat with AI
- `.weather [city]` - Get weather info
- `.translate <text>` - Translate text
- `.download <url>` - Download media
- And many more...

## Module System

HyperWa uses a modular architecture. To create a new module:

1. Create a file in `modules/` directory
2. Export a class with `commands` array
3. The module will be auto-loaded on startup

Example:

```javascript
class MyModule {
  constructor(bot) {
    this.bot = bot;
    this.name = 'mymodule';
    this.commands = [{
      name: 'mycommand',
      description: 'My custom command',
      usage: '.mycommand',
      permissions: 'public',
      execute: async (msg, params, context) => {
        return 'Hello from my module!';
      }
    }];
  }
}

export default MyModule;
```

## Database

HyperWa uses MongoDB for:

- Authentication session storage
- Message history
- User settings
- Contact mappings
- Module data

## Security Features

- Row-level security for data access
- Rate limiting on commands
- User permission system
- Blocked user list
- Message filtering
- Environment-based configuration

## Telegram Bridge

Sync WhatsApp messages with Telegram:

- Bi-directional message sync
- Media forwarding
- Contact name resolution
- Topic-based organization
- Command control via Telegram

## AI Features

Powered by Google Gemini:

- Natural language command execution
- Conversation memory
- Image analysis
- Code assistance
- Creative writing
- Multi-language support

## Support

For deployment issues, check:

1. Application logs on your hosting platform
2. [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting
3. Environment variables are correctly set
4. MongoDB connection is working

## License

MIT License - See LICENSE file for details

## Credits

Developed by Arshman
Version 3.0.0

## Notes

- Free tier hosting may have limitations
- MongoDB Atlas free tier is sufficient for most use cases
- Koyeb offers better uptime than Render free tier
- Keep-alive mechanism works on both platforms
- Bot requires initial QR code scan for WhatsApp authentication
