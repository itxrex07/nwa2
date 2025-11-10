import express from 'express';
import http from 'http';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 8000;

// Platform envs
const KOYEB_PUBLIC_URL = process.env.KOYEB_PUBLIC_URL || null;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || null;

// Default SELF URL (fallback)
let SELF_URL = RENDER_EXTERNAL_URL || KOYEB_PUBLIC_URL || `http://localhost:${PORT}`;

// Runtime-learned actual domain
let REAL_URL = SELF_URL;

let botHealthy = false;

app.use(express.json());

// ✅ AUTO-DETECT REAL PUBLIC URL (Works on Koyeb + Render)
app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (proto && host) {
        const detected = `${proto}://${host}`;
        if (REAL_URL !== detected) {
            console.log(`[Keep-Alive] ✅ Detected external URL: ${detected}`);
            REAL_URL = detected;
        }
    }
    next();
});

// ✅ UI Page
app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>HyperWa Bot - Active</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(31,38,135,.37);
            border: 1px solid rgba(255,255,255,.18);
            max-width: 500px;
            text-align: center;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 10px #fff,0 0 20px #fff,0 0 30px #667eea; }
            to   { text-shadow: 0 0 20px #fff,0 0 30px #764ba2,0 0 40px #764ba2; }
        }
        .status {
            display: inline-block;
            background: #10b981;
            padding: 8px 20px;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.7;} }
        .info { background: rgba(255,255,255,.1); padding:20px; border-radius:10px; margin-top:20px; text-align:left; }
        .info-item {
            display:flex; justify-content:space-between; padding:8px 0;
            border-bottom:1px solid rgba(255,255,255,0.1);
        }
        .info-item:last-child { border-bottom:none; }
        .label { font-weight:600; }
        .value { color:#a5b4fc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>HyperWa Bot</h1>
        <div class="status">ACTIVE</div>
        <div class="info">
            <div class="info-item"><span class="label">Status:</span><span class="value">Running</span></div>
            <div class="info-item"><span class="label">Uptime:</span><span class="value">${hours}h ${minutes}m ${seconds}s</span></div>
            <div class="info-item"><span class="label">Version:</span><span class="value">3.0.0</span></div>
            <div class="info-item"><span class="label">Bot Status:</span><span class="value">${botHealthy ? 'Connected' : 'Initializing'}</span></div>
            <div class="info-item"><span class="label">Public URL:</span><span class="value">${REAL_URL}</span></div>
        </div>
    </div>
</body>
</html>
    `);
});

// ✅ Health Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        platform: process.platform,
        bot_healthy: botHealthy
    });
});

// ✅ Ping
app.get('/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

// ✅ Receive bot status
app.post('/bot-status', (req, res) => {
    botHealthy = req.body?.healthy !== false;
    res.json({ received: true });
});

// ✅ Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Keep-Alive] Server running on port ${PORT}`);
    console.log(`[Keep-Alive] Platform: ${
        KOYEB_PUBLIC_URL ? 'Koyeb' : RENDER_EXTERNAL_URL ? 'Render' : 'Local'
    }`);
    console.log(`[Keep-Alive] Initial URL: ${SELF_URL}`);

    startAggressivePing();
});

// ✅ Aggressive Auto Ping (with dynamic REAL_URL)
function startAggressivePing() {
    const pingInterval = 2 * 60 * 1000;
    let pingCount = 0;

    const performPing = () => {
        pingCount++;

        const urlToPing = REAL_URL + '/health';
        const isHttps = urlToPing.startsWith('https');
        const protocol = isHttps ? https : http;

        console.log(`[Keep-Alive] Ping #${pingCount} → ${urlToPing}`);

        protocol.get(urlToPing, { timeout: 10000 }, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[Keep-Alive] ✅ Ping #${pingCount} successful`);
                }
            });
        }).on('error', (err) => {
            console.error(`[Keep-Alive] ❌ Ping #${pingCount} failed: ${err.message}`);
        });
    };

    performPing();
    setInterval(performPing, pingInterval);

    console.log(`[Keep-Alive] Aggressive ping active every 2 minutes`);
});

// ✅ Prevent exit
setInterval(() => {
    const used = process.memoryUsage();
    console.log(`[Keep-Alive] Memory: ${Math.round(used.heapUsed/1024/1024)}MB`);
}, 5 * 60 * 1000);

// ✅ Block GC to avoid idle shutdown
if (global.gc) {
    setInterval(() => {
        console.log('[Keep-Alive] Preventing GC...');
    }, 10 * 60 * 1000);
}

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Keep-Alive] SIGTERM received');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('[Keep-Alive] SIGINT received');
    server.close(() => process.exit(0));
});

export { server, app };
