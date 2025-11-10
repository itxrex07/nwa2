# HyperWa Bot Deployment Guide

Your HyperWa bot is now configured for deployment on Render and Koyeb with anti-sleep mechanisms.

## Features

- Ultra-aggressive keep-alive server that pings every 2 minutes
- Self-ping with HTTPS support for secure deployments
- Docker health checks for Koyeb (30s interval)
- Beautiful status page with auto-refresh (30s)
- Browser-side keep-alive pings (every 60s)
- Memory monitoring and logging
- Production-ready configuration for 24/7 uptime
- Prevents deep sleep on free tier platforms

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

## Keep-Alive Mechanism (Enhanced)

The bot uses a multi-layered keep-alive approach to prevent deep sleep:

### Server-Side
1. Express server runs on port 8000 (Koyeb) or dynamic PORT (Render)
2. Ultra-aggressive self-pings every 2 minutes
3. Continuous memory monitoring every 5 minutes
4. Connection keep-alive headers enabled
5. Process keeps event loop busy with timers

### Client-Side
1. Beautiful status page at root URL with auto-refresh every 30s
2. Browser-side health check pings every 60s via JavaScript
3. Bot status indicator shows connection health

### Platform Integration
1. **Koyeb**: Docker health checks every 30s with 10s timeout
2. **Render**: Platform health check at `/health` endpoint
3. Both platforms configured for aggressive monitoring

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

If the bot still goes into deep sleep despite the enhanced keep-alive:

1. **Check Logs**: Look for `[Keep-Alive]` messages - should see pings every 2 minutes
2. **Verify URL**: Ensure KOYEB_PUBLIC_URL or RENDER_EXTERNAL_URL is set
3. **Test Endpoint**: Visit your app URL in browser - should show green "ACTIVE" status
4. **Health Check**: `curl https://your-app.koyeb.app/health` should return JSON
5. **Docker Logs**: On Koyeb, check if Docker health checks are passing
6. **Process Check**: Both `keep-alive.js` and `index.js` should be running
7. **Memory**: Bot shouldn't use more than 512MB (configured limit)

### MongoDB connection issues

1. Verify MONGO_URI is correct and accessible
2. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for cloud platforms)
3. Ensure database user has proper permissions

### Build failures

1. Check Node.js version (requires Node 22)
2. Verify all dependencies in package.json are valid
3. Check build logs for specific errors

## Important Notes

### Koyeb (Recommended)
- More stable for 24/7 free tier operation
- Docker health checks ensure automatic restart if needed
- Keep-alive pings every 2 minutes prevent sleep
- Better memory management with 512MB limit

### Render
- Free tier may have occasional delays
- Keep-alive pings every 2 minutes keep process active
- Health check endpoint enables platform monitoring
- Status page accessible at your app URL

### General
- Both platforms require MONGO_URI for database connection
- Keep-alive logs show `[Keep-Alive]` prefix for easy debugging
- Bot status visible in browser at app root URL
- Multiple redundant keep-alive mechanisms ensure uptime

## Support

For issues related to deployment:
- Check platform-specific documentation
- Review application logs
- Verify all environment variables are set correctly
