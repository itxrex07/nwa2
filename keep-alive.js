import express from 'express';
import http from 'http';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 8000;
const KOYEB_PUBLIC_URL = process.env.KOYEB_PUBLIC_URL;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const SELF_URL = RENDER_EXTERNAL_URL || KOYEB_PUBLIC_URL || `http://localhost:${PORT}`;

let botHealthy = false;

app.use(express.json());

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
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            max-width: 500px;
            text-align: center;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #667eea; }
            to { text-shadow: 0 0 20px #fff, 0 0 30px #764ba2, 0 0 40px #764ba2; }
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
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .info {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: left;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .info-item:last-child { border-bottom: none; }
        .label { font-weight: 600; }
        .value { color: #a5b4fc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>HyperWa Bot</h1>
        <div class="status">ACTIVE</div>
        <div class="info">
            <div class="info-item">
                <span class="label">Status:</span>
                <span class="value">Running</span>
            </div>
            <div class="info-item">
                <span class="label">Uptime:</span>
                <span class="value">${hours}h ${minutes}m ${seconds}s</span>
            </div>
            <div class="info-item">
                <span class="label">Version:</span>
                <span class="value">3.0.0</span>
            </div>
            <div class="info-item">
                <span class="label">Bot Status:</span>
                <span class="value">${botHealthy ? 'Connected' : 'Initializing'}</span>
            </div>
        </div>
    </div>
    <script>
        // Keep page alive by making requests
        setInterval(() => {
            fetch('/health').catch(() => {});
        }, 60000);
    </script>
</body>
</html>
    `);
});

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

app.get('/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

app.post('/bot-status', (req, res) => {
    botHealthy = req.body?.healthy !== false;
    res.json({ received: true });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Keep-Alive] Server running on port ${PORT}`);
    console.log(`[Keep-Alive] Public URL: ${SELF_URL}`);
    console.log(`[Keep-Alive] Platform: ${KOYEB_PUBLIC_URL ? 'Koyeb' : RENDER_EXTERNAL_URL ? 'Render' : 'Local'}`);
    startAggressivePing();
});

function startAggressivePing() {
    // Ultra aggressive pinging - every 2 minutes
    const pingInterval = 2 * 60 * 1000;
    let pingCount = 0;

    const performPing = () => {
        pingCount++;
        const pingTime = new Date().toISOString();
        const isHttps = SELF_URL.startsWith('https');
        const protocol = isHttps ? https : http;

        // Log for debugging
        console.log(`[Keep-Alive] Ping #${pingCount} at ${pingTime}`);

        protocol.get(SELF_URL + '/health', {
            timeout: 10000,
            headers: {
                'User-Agent': 'HyperWa-KeepAlive/3.0.0',
                'Connection': 'keep-alive'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[Keep-Alive] Ping successful #${pingCount}`);
                }
            });
        }).on('error', (err) => {
            console.error(`[Keep-Alive] Ping failed #${pingCount}: ${err.message}`);
        }).on('timeout', function() {
            this.destroy();
        });
    };

    // Perform first ping immediately
    performPing();

    // Then schedule regular pings
    setInterval(performPing, pingInterval);
    console.log(`[Keep-Alive] Aggressive ping enabled every ${pingInterval / 1000 / 60} minutes`);
}

// Prevent process from exiting
setInterval(() => {
    // Keep event loop busy
    const used = process.memoryUsage();
    console.log(`[Keep-Alive] Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
}, 5 * 60 * 1000);

// Force garbage collection prevention
if (global.gc) {
    setInterval(() => {
        console.log('[Keep-Alive] Preventing garbage collection...');
    }, 10 * 60 * 1000);
}

process.on('SIGTERM', () => {
    console.log('[Keep-Alive] SIGTERM received, initiating shutdown...');
    server.close(() => {
        console.log('[Keep-Alive] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[Keep-Alive] SIGINT received, initiating shutdown...');
    server.close(() => {
        console.log('[Keep-Alive] Server closed');
        process.exit(0);
    });
});

export { server, app };
