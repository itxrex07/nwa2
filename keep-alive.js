import express from "express";
import http from "http";
import https from "https";

const app = express();
const PORT = process.env.PORT || 8000;

let REAL_URL = null;
let BOT_HEALTHY = false;

// Guess from env first (Render/Koyeb)
if (process.env.RENDER_EXTERNAL_URL) REAL_URL = process.env.RENDER_EXTERNAL_URL;
if (process.env.KOYEB_PUBLIC_URL) REAL_URL = process.env.KOYEB_PUBLIC_URL;

// Log helper
const log = (...msg) => console.log("[KeepAlive ADV]", ...msg);

// ✅ Learn REAL public URL from proxy headers (Koyeb + Render reliable)
app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (proto && host) {
        const newURL = `${proto}://${host}`;
        if (REAL_URL !== newURL) {
            REAL_URL = newURL;
            log("✅ Learned domain:", REAL_URL);
            restartExternalPinger();
        }
    }
    next();
});

// ✅ UI
app.get("/", (req, res) => {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);

    res.send(`
        <html>
        <head><title>HyperWa Bot</title></head>
        <body style="background:#111;color:#eee;font-family:Arial;text-align:center;padding:40px;">
            <h1>HyperWa Bot ✅</h1>
            <p>Status: Running</p>
            <p>Uptime: ${h}h ${m}m ${s}s</p>
            <p>Detected URL: <b>${REAL_URL || "-"}</b></p>
            <p>Bot Status: <b>${BOT_HEALTHY ? "Connected" : "Initializing"}</b></p>
            <p>Check: <code>/whoami</code></p>
        </body>
        </html>
    `);
});

// ✅ Health
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        uptime: process.uptime(),
        detected: REAL_URL,
        bot: BOT_HEALTHY,
        ts: new Date().toISOString()
    });
});

// ✅ Whoami debug
app.get("/whoami", (req, res) => {
    res.json({
        detected_url: REAL_URL,
        headers: {
            "x-forwarded-proto": req.headers["x-forwarded-proto"],
            "x-forwarded-host": req.headers["x-forwarded-host"],
            host: req.headers.host
        }
    });
});

// ✅ Bot status endpoint
app.post("/bot-status", (req, res) => {
    BOT_HEALTHY = req.body?.healthy !== false;
    res.json({ ok: true });
});

// ✅ Local ping (keeps Node active)
let localTimer = null;
function startLocalPinger() {
    if (localTimer) clearInterval(localTimer);

    const localURL = `http://127.0.0.1:${PORT}/health`;
    log("Local pinger ->", localURL);

    localTimer = setInterval(() => {
        http.get(localURL, res => res.resume());
    }, 120000); // every 2 min
}
startLocalPinger();

// ✅ External pinger (only after REAL_URL learned)
let externalTimer = null;

function restartExternalPinger() {
    if (!REAL_URL) return;
    if (externalTimer) clearInterval(externalTimer);

    const url = REAL_URL + "/health";
    const isHttps = REAL_URL.startsWith("https");
    const proto = isHttps ? https : http;

    log("External pinger ->", url);

    externalTimer = setInterval(async () => {
        try {
            const time = new Date().toISOString();
            log(`PING → ${url} @ ${time}`);

            proto.get(url, res => {
                res.on("data", () => {});
                res.on("end", () => {
                    if (res.statusCode === 200) {
                        log("✅ External ping OK");
                    } else {
                        log("⚠️ Non-200 status:", res.statusCode);
                    }
                });
            }).on("error", () => {
                log("❌ External ping failed");
            });

        } catch {}
    }, 240000); // every 4 minutes
}

// ✅ Domain verification (HEAD request) every 10 min
setInterval(() => {
    if (!REAL_URL) return;

    const checkURL = REAL_URL + "/health";
    const proto = REAL_URL.startsWith("https") ? https : http;

    proto.request(checkURL, { method: "HEAD", timeout: 3000 }, (res) => {
        if (res.statusCode === 200) log("✅ Domain verified:", REAL_URL);
        else log("⚠️ Domain check returned:", res.statusCode);
    }).on("error", () => {
        log("❌ Domain failed. Waiting for new whoami header...");
    }).end();

}, 600000); // every 10 minutes

// ✅ Start server
const server = app.listen(PORT, "0.0.0.0", () => {
    log(`Server running on ${PORT}`);
    log(`Initial URL: ${REAL_URL || "none"}`);
    if (REAL_URL) restartExternalPinger();
});

// ✅ Safe exit
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));

export { server, app };
