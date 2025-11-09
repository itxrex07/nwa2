import express from 'express';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.KOYEB_PUBLIC_URL || `http://localhost:${PORT}`;

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
                <span class="label">Platform:</span>
                <span class="value">Node.js</span>
            </div>
        </div>
    </div>
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
        platform: process.platform
    });
});

app.get('/ping', (req, res) => {
    res.json({ alive: true, timestamp: Date.now() });
});

const server = app.listen(PORT, () => {
    console.log(`Keep-alive server running on port ${PORT}`);
    console.log(`Access at: ${SELF_URL}`);
    startSelfPing();
});

function startSelfPing() {
    const pingInterval = 5 * 60 * 1000;

    setInterval(() => {
        const url = `${SELF_URL}/health`;

        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`Self-ping successful at ${new Date().toISOString()}`);
                }
            });
        }).on('error', (err) => {
            console.error(`Self-ping failed: ${err.message}`);
        });
    }, pingInterval);

    console.log(`Self-ping scheduled every ${pingInterval / 1000 / 60} minutes`);
}

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down keep-alive server...');
    server.close(() => {
        console.log('Keep-alive server closed');
        process.exit(0);
    });
});
