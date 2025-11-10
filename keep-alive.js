// keepalive.js (enhanced with Live Hacker-style Console)
import express from "express";
import http from "http";
import https from "https";
import { once } from "events";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json()); // parse JSON bodies

let REAL_URL = null;
let BOT_HEALTHY = false;

// Guess from env first (Render/Koyeb)
if (process.env.RENDER_EXTERNAL_URL) REAL_URL = process.env.RENDER_EXTERNAL_URL;
if (process.env.KOYEB_PUBLIC_URL) REAL_URL = process.env.KOYEB_PUBLIC_URL;

// --- Logging + SSE broadcaster ---
const clients = new Set();
const LOG_BUFFER_SIZE = 200;
const logBuffer = [];

function formatLine(level, ...parts) {
    const ts = new Date().toISOString();
    const msg = parts.map(p => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ');
    return { ts, level: (level || "info").toLowerCase(), msg };
}

function pushToBuffer(lineObj) {
    logBuffer.push(lineObj);
    if (logBuffer.length > LOG_BUFFER_SIZE) logBuffer.shift();
}

function broadcastLine(lineObj) {
    const payload = `data: ${JSON.stringify(lineObj)}\n\n`;
    for (const res of clients) {
        try { res.write(payload); } catch {}
    }
}

const log = (...parts) => {
    // if first arg is level-like (e.g., 'error', 'warn', 'info', 'debug')
    let level = "info";
    if (typeof parts[0] === 'string' && /^(error|warn|info|debug|trace)$/i.test(parts[0])) {
        level = parts.shift();
    }
    const lineObj = formatLine(level, ...parts);
    pushToBuffer(lineObj);
    broadcastLine(lineObj);
    // also print to server stdout in readable form
    const simple = `[${lineObj.ts}] [${lineObj.level.toUpperCase()}] ${lineObj.msg}`;
    console.log("[KeepAlive ADV]", simple);
};

// expose logger for other modules via import { logger } = require(...) pattern is not set here
// but other files can call POST /log (below) or you can import this file and call exported log

// ✅ Learn REAL public URL from proxy headers (Koyeb + Render reliable)
app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (proto && host) {
        const newURL = `${proto}://${host}`;
        if (REAL_URL !== newURL) {
            REAL_URL = newURL;
            log('info', "Learned domain:", REAL_URL);
            restartExternalPinger();
        }
    }
    next();
});

// --- UI: Hacker-style console ---
app.get("/", (req, res) => {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);

    res.send(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>HyperWa Bot — Live Console</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root{--bg:#071013;--panel:#0b1618;--muted:#6da29a;--accent:#7CFC00}
  html,body{height:100%;margin:0;background:linear-gradient(180deg,#000 0%, #071013 100%);font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace;color:#c9f9cf}
  .wrap{display:flex;flex-direction:column;height:100vh;padding:12px;gap:12px}
  .top{display:flex;gap:12px;align-items:center}
  .card{background:rgba(0,0,0,0.35);border-radius:8px;padding:12px;box-shadow:0 6px 18px rgba(0,0,0,0.6);border:1px solid rgba(124,252,0,0.06)}
  h1{margin:0;font-size:18px;color:var(--accent)}
  .meta{font-size:12px;color:var(--muted)}
  .controls{margin-left:auto;display:flex;gap:8px;align-items:center}
  button{background:transparent;border:1px solid rgba(124,252,0,0.12);padding:6px 10px;border-radius:6px;color:var(--accent);cursor:pointer}
  button.danger{border-color:#ff6b6b;color:#ff6b6b}
  .console{flex:1;background:#051010;border-radius:6px;padding:12px;overflow:auto;font-size:13px;line-height:1.4;color:#bfffbf;box-shadow:inset 0 0 40px rgba(0,0,0,0.6)}
  .line{white-space:pre-wrap;font-family:inherit}
  .ts{opacity:0.55;margin-right:8px}
  .level-info{color:#7cfb9a}
  .level-warn{color:#ffd76b}
  .level-error{color:#ff7b7b}
  .level-debug{color:#9ad3ff}
  .status-pill{padding:6px 8px;border-radius:999px;background:rgba(124,252,0,0.06);border:1px solid rgba(124,252,0,0.08);color:var(--accent);font-weight:600}
  .small{font-size:12px;color:var(--muted)}
  .top-right{display:flex;gap:8px;align-items:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="card">
      <h1>HyperWa Bot <span class="small">— Live Console</span></h1>
      <div class="meta">Uptime: ${h}h ${m}m ${s}s — Detected URL: <b id="detected">${REAL_URL || "-"}</b> — Bot: <span id="botStatus" class="status-pill">${BOT_HEALTHY ? "Connected" : "Initializing"}</span></div>
    </div>

    <div class="controls">
      <button id="clearBtn">Clear</button>
      <button id="pauseBtn">Pause</button>
      <button id="copyBtn">Copy</button>
      <button id="downloadBtn">Download</button>
    </div>
  </div>

  <div id="console" class="console card" aria-live="polite"></div>
</div>

<script>
(function(){
  const consoleEl = document.getElementById('console');
  const pauseBtn = document.getElementById('pauseBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const detectedEl = document.getElementById('detected');
  const botStatusEl = document.getElementById('botStatus');

  let paused = false;
  let buffer = []; // in-browser buffer
  const MAX = 1000;

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function renderLine(obj){
    const ts = esc(obj.ts);
    const lvl = esc(obj.level);
    const msg = esc(obj.msg);
    const span = document.createElement('div');
    span.className = 'line level-' + (lvl || 'info');
    span.innerHTML = '<span class="ts">['+ts+']</span> <span class="lvl">['+lvl.toUpperCase()+']</span> ' + msg;
    return span;
  }

  function append(obj){
    if (paused) { buffer.push(obj); if (buffer.length>MAX) buffer.shift(); return; }
    const node = renderLine(obj);
    consoleEl.appendChild(node);
    // limit DOM rows
    while (consoleEl.childElementCount > MAX) consoleEl.removeChild(consoleEl.firstChild);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function flushBuffer(){
    if (paused) return;
    while(buffer.length) append(buffer.shift());
  }

  // SSE
  const s = new EventSource('/logs/stream');
  s.onmessage = (ev) => {
    try {
      const obj = JSON.parse(ev.data);
      append(obj);
      // update small elements
      if (obj.msg && obj.msg.includes('Learned domain:')) {
        const m = obj.msg.split('Learned domain:').pop().trim();
        detectedEl.textContent = m;
      }
      if (obj.msg && obj.msg.includes('Bot Status:')) {
        const b = obj.msg.split('Bot Status:').pop().trim();
        botStatusEl.textContent = b;
      }
    } catch(e){}
  };
  s.onerror = (e) => {
    append({ ts: new Date().toISOString(), level: 'warn', msg: 'SSE connection lost — attempting reconnect...' });
  };

  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) flushBuffer();
  };
  clearBtn.onclick = () => { consoleEl.innerHTML = ''; buffer = []; };
  copyBtn.onclick = async () => {
    const text = Array.from(consoleEl.children).map(c => c.textContent).join('\\n');
    try { await navigator.clipboard.writeText(text); copyBtn.textContent = 'Copied'; setTimeout(()=>copyBtn.textContent='Copy',1200); } catch { copyBtn.textContent='Failed'; setTimeout(()=>copyBtn.textContent='Copy',1200); }
  };
  downloadBtn.onclick = () => {
    const text = Array.from(consoleEl.children).map(c => c.textContent).join('\\n');
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'hyperwa-logs.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  // on load: fetch recent buffer
  fetch('/logs/recent').then(r => r.json()).then(arr => {
    arr.forEach(append);
  }).catch(()=>{});
})();
</script>
</body>
</html>`);
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

// ✅ Bot status endpoint (still works, now logs status)
app.post("/bot-status", (req, res) => {
    BOT_HEALTHY = req.body?.healthy !== false;
    log('info', `Bot Status: ${BOT_HEALTHY ? 'Connected' : 'Disconnected'}`);
    res.json({ ok: true });
});

// ✅ External modules / bot can POST logs here
// body: { level: "info"|"warn"|"error"|"debug", msg: "..." }
app.post("/log", (req, res) => {
    const { level, msg } = req.body || {};
    if (!msg) return res.status(400).json({ ok:false, error: 'missing msg' });
    log(level || 'info', msg);
    res.json({ ok: true });
});

// ✅ recent logs (for initial UI load)
app.get("/logs/recent", (req, res) => {
    res.json(logBuffer.slice(-100));
});

// ✅ SSE endpoint for live logs
app.get("/logs/stream", (req, res) => {
    res.writeHead(200, {
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
    });
    res.write("\n");

    // send recent lines first
    for (const l of logBuffer) {
        res.write(`data: ${JSON.stringify(l)}\n\n`);
    }

    clients.add(res);

    // remove on close
    req.on("close", () => { clients.delete(res); try { res.end(); } catch {} });
});

// ✅ Local ping (keeps Node active)
let localTimer = null;
function startLocalPinger() {
    if (localTimer) clearInterval(localTimer);

    const localURL = `http://127.0.0.1:${PORT}/health`;
    log('info', "Local pinger ->", localURL);

    localTimer = setInterval(() => {
        http.get(localURL, res => res.resume()).on('error', ()=>{});
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

    log('info', "External pinger ->", url);

    externalTimer = setInterval(async () => {
        try {
            const time = new Date().toISOString();
            log('debug', `PING → ${url} @ ${time}`);

            proto.get(url, res => {
                res.on("data", () => {});
                res.on("end", () => {
                    if (res.statusCode === 200) {
                        log('info', "External ping OK");
                    } else {
                        log('warn', "Non-200 status:", res.statusCode);
                    }
                });
            }).on("error", () => {
                log('error', "External ping failed");
            });

        } catch (e) {
            log('error', 'External pinger error', String(e));
        }
    }, 240000); // every 4 minutes
}

// ✅ Domain verification (HEAD request) every 10 min
setInterval(() => {
    if (!REAL_URL) return;

    const checkURL = REAL_URL + "/health";
    const proto = REAL_URL.startsWith("https") ? https : http;

    const req = proto.request(checkURL, { method: "HEAD", timeout: 3000 }, (res) => {
        if (res.statusCode === 200) log('info', "Domain verified:", REAL_URL);
        else log('warn', "Domain check returned:", res.statusCode);
    });
    req.on("error", () => {
        log('warn', "Domain failed. Waiting for new whoami header...");
    });
    req.end();

}, 600000); // every 10 minutes

// ✅ Start server
const server = app.listen(PORT, "0.0.0.0", () => {
    log('info', `Server running on ${PORT}`);
    log('info', `Initial URL: ${REAL_URL || "none"}`);
    if (REAL_URL) restartExternalPinger();
});

// ✅ Safe exit
process.on("SIGTERM", () => { log('info','SIGTERM received, shutting down'); server.close(() => process.exit(0)); });
process.on("SIGINT", () => { log('info','SIGINT received, shutting down'); server.close(() => process.exit(0)); });

export { server, app, log };
