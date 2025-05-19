// Minimal server for serving the QStrike dashboard
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Create dummy SSE endpoint for streaming events
const dummyEvents = [
  { event: 'ttb_update', alg: 'RSA2048', ttb_sec: 43200 },
  { event: 'ttb_update', alg: 'ECCP256', ttb_sec: 32000 },
  { event: 'ttb_update', alg: 'AES128', ttb_sec: 16000 },
  { event: 'risk_update', asset: 'VPN_GATEWAY', crypto: 'RSA2048', level: 'High', ttb_sec: 43200 },
  { event: 'vuln_update', top: [
    { asset: 'VPN_GATEWAY', crypto: 'RSA2048', risk_score: 0.92, ttb_sec: 43200, priority: 'Urgent' },
    { asset: 'PAYMENT_GATEWAY', crypto: 'TLS1.2(RSA2048)', risk_score: 0.89, ttb_sec: 43000, priority: 'Urgent' }
  ]},
  { event: 'orchestra_power', aggregate_power: 150000 },
  { event: 'shor_progress', stages: [
    { stage: 'compile', pct_complete: 0.6 },
    { stage: 'order_find', pct_complete: 0.3 },
    { stage: 'post_process', pct_complete: 0.05 }
  ], eta_sec: 43200 },
  { event: 'grover_stats', calls_per_sec: 1250000, error_rate: 0.0011 },
  { event: 'fidelity_update', avg_fidelity: 0.992 },
  { event: 'job_status', running: 12, queued: 3, failed: 1, sla_pct: 99.5 },
  { event: 'compliance_update', framework: 'PCI-DSS', status: 'pass' },
  { event: 'pqc_update', algorithm: 'Kyber1024', env: 'prod', pct_done: 30 }
];

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // SSE endpoint for streaming dashboard data
  if (req.url === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial data
    dummyEvents.forEach(event => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    
    // Keep the connection alive with periodic updates
    const interval = setInterval(() => {
      const randomEvent = dummyEvents[Math.floor(Math.random() * dummyEvents.length)];
      res.write(`data: ${JSON.stringify(randomEvent)}\n\n`);
    }, 3000);
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('Client disconnected from SSE');
    });
    
    return;
  }
  
  // Serve static files from dist directory
  let filePath = '.' + req.url;
  
  // Default to index.html for root path
  if (filePath === './') {
    filePath = './index.html';
  } else if (!path.extname(filePath)) {
    // If no file extension, assume it's a route and serve index.html
    filePath = './index.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(path.join(__dirname, 'dist', filePath), (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, try serving index.html
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, indexContent) => {
          if (err) {
            // Cannot even serve index.html
            res.writeHead(500);
            res.end('Error loading index.html');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // File found and served successfully
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║ QStrike Dashboard Server running at http://localhost:${PORT} ║
╚════════════════════════════════════════════════════════╝
  `);
});