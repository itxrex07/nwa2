# HyperWa Bot Deployment Guide

Your HyperWa bot is now configured for deployment on Render and Koyeb with anti-sleep mechanisms.

## Features

- Auto keep-alive server on port 3000/8000
- Self-ping every 5 minutes to prevent sleeping
- Health check endpoints for monitoring
- Beautiful status page at root URL
- Production-ready configuration

## Deploy to Render

### Method 1: One-Click Deploy

1. Click the button in README or visit: https://render.com/deploy
2. Connect your GitHub repository
3. Set environment variables (MongoDB URI is required)
4. Click "Create Web Service"

### Method 2: Manual Deploy

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `node keep-alive.js & node index.js`
5. Add environment variables:
   - `MONGO_URI` (required)
   - `MONGO_DB_NAME` (default: hyperwa)
   - `NODE_ENV=production`
6. Deploy

## Deploy to Koyeb

### Method 1: Using Dockerfile

1. Create a new app on Koyeb
2. Select "Docker" as deployment method
3. Set Dockerfile path: `Dockerfile.koyeb`
4. Set environment variables (MongoDB URI required)
5. Deploy

### Method 2: Using Git

1. Create a new app on Koyeb
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set run command: `node keep-alive.js & node index.js`
5. Set port to 8000
6. Add environment variables
7. Deploy

## Required Environment Variables

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=hyperwa
NODE_ENV=production
```

## Optional Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_weather_api_key
```

## Keep-Alive Mechanism

The bot includes a keep-alive server that:

1. Runs an Express server on the assigned PORT
2. Serves a status page at the root URL
3. Provides health check endpoint at `/health`
4. Pings itself every 5 minutes to prevent sleeping
5. Works automatically on both Render and Koyeb

## Health Check Endpoints

- `GET /` - Status page with bot information
- `GET /health` - JSON health status
- `GET /ping` - Simple alive check

## Monitoring

Access your bot's status page at:
- Render: `https://your-app-name.onrender.com`
- Koyeb: `https://your-app-name.koyeb.app`

## Troubleshooting

### Bot keeps sleeping on free tier

The keep-alive mechanism should prevent this, but if it still happens:

1. Check if the keep-alive server is running (check logs)
2. Verify PORT environment variable is set correctly
3. Ensure the platform URL env var is available (RENDER_EXTERNAL_URL or KOYEB_PUBLIC_URL)
4. Check if health check endpoint is responding

### MongoDB connection issues

1. Verify MONGO_URI is correct and accessible
2. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for cloud platforms)
3. Ensure database user has proper permissions

### Build failures

1. Check Node.js version (requires Node 22)
2. Verify all dependencies in package.json are valid
3. Check build logs for specific errors

## Notes

- Free tier on Render may still experience some delays after 15 minutes of inactivity
- Koyeb free tier is more stable for 24/7 operation
- Both platforms support custom domains
- Keep-alive pings happen every 5 minutes
- The bot automatically detects the platform and configures URLs

## Support

For issues related to deployment:
- Check platform-specific documentation
- Review application logs
- Verify all environment variables are set correctly
