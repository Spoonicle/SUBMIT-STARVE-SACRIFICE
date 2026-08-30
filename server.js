const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Try requiring express and cors; if not installed, use robust native HTTP server fallback
let express, cors;
try {
  express = require('express');
  cors = require('cors');
} catch (e) {
  // Will use native HTTP server module below
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Global server ticker state
let globalTickCount = 0;
const clients = new Set();

// Character sets for server stream generation
const ASCII_CHAR_SETS = {
  matrix: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrftjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  hex: '0123456789ABCDEFx0123456789abcdef',
  binary: '01',
  blocks: ' .:-=+*#%@',
  symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~\\',
};

// Generate random ASCII string chunk of specified length and character type
function generateRandomAsciiChunk(length = 80, setKey = 'matrix') {
  const chars = ASCII_CHAR_SETS[setKey] || ASCII_CHAR_SETS.matrix;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Server ticker loop running at 50ms intervals (20 Ticks/Sec base rate)
setInterval(() => {
  globalTickCount++;

  if (clients.size > 0) {
    const streamPayload = JSON.stringify({
      tick: globalTickCount,
      timestamp: Date.now(),
      serverUptime: Math.floor(process.uptime()),
      activeClients: clients.size,
      cpuUsage: Math.round((os.loadavg()[0] || 0.15) * 100) / 100,
      asciiChunk: generateRandomAsciiChunk(120, 'matrix'),
      hexChunk: generateRandomAsciiChunk(60, 'hex'),
      symbolsChunk: generateRandomAsciiChunk(60, 'symbols'),
    });

    for (const res of clients) {
      res.write(`data: ${streamPayload}\n\n`);
    }
  }
}, 50);

// MIME type map for static serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function handleStaticFile(req, res) {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(PUBLIC_DIR, safePath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

function handleSseStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial handshake tick
  res.write(`data: ${JSON.stringify({ type: 'connected', tick: globalTickCount })}\n\n`);

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

function handleApiStatus(req, res) {
  const statusData = {
    status: 'online',
    tick: globalTickCount,
    serverUptimeSeconds: Math.floor(process.uptime()),
    activeSseClients: clients.size,
    platform: os.platform(),
    arch: os.arch(),
    memoryFreeMB: Math.round(os.freemem() / 1024 / 1024),
    memoryTotalMB: Math.round(os.totalmem() / 1024 / 1024),
  };

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(statusData, null, 2));
}

// Server creation logic (Express if present, else Native HTTP)
if (express) {
  const app = express();
  if (cors) app.use(cors());

  app.use(express.static(__dirname));
  app.use(express.static(PUBLIC_DIR));

  app.get('/api/ascii-stream', (req, res) => handleSseStream(req, res));
  app.get('/api/status', (req, res) => handleApiStatus(req, res));

  app.listen(PORT, () => {
    printBanner();
  });
} else {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    if (url === '/api/ascii-stream') {
      handleSseStream(req, res);
    } else if (url === '/api/status') {
      handleApiStatus(req, res);
    } else {
      handleStaticFile(req, res);
    }
  });

  server.listen(PORT, () => {
    printBanner();
  });
}

function printBanner() {
  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   ▲  █████╗ ███████╗██████╗██╗██╗   ██╗███╗   ██╗███████╗   │
  │  ██║██╔══██╗██╔════╝██╔═══╝██║██║   ██║████╗  ██║██╔════╝   │
  │  ██║███████║███████╗██║    ██║██║   ██║██╔██╗ ██║█████╗     │
  │  ██║██╔══██║╚════██║██║    ██║██║   ██║██║╚██╗██║██╔══╝     │
  │  ██║██║  ██║███████║╚██████╔╝██║╚█████╔╝██║ ╚████║███████╗   │
  │  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝ ╚════╝ ╚═╝  ╚═══╝╚══════╝   │
  │                                                             │
  │  ★ LIVE ASCII TICK STREAM SERVER IS ACTIVE!                │
  │  ► http://localhost:${PORT}                                   │
  │  ► Live SSE Endpoint: http://localhost:${PORT}/api/ascii-stream│
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
  `);
}
