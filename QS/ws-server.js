const http = require('http');
const WebSocket = require('ws');

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('QStrike WebSocket Server');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Generate mock quantum data
function generateMockData() {
  const providers = ['IBM', 'Google', 'IonQ', 'Quantinuum', 'Rigetti'];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  
  return {
    id: `job-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    provider,
    qubits: Math.floor(Math.random() * 50) + 5,
    circuit_depth: Math.floor(Math.random() * 100) + 10,
    status: Math.random() > 0.8 ? 'ERROR' : 'SUCCESS',
    algorithm: Math.random() > 0.5 ? 'Shor' : 'Grover',
    execution_time_ms: Math.floor(Math.random() * 5000),
    error_rate: Math.random() * 0.1,
  };
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to QStrike WebSocket' }));
  
  // Send mock data every second
  const interval = setInterval(() => {
    const data = generateMockData();
    ws.send(JSON.stringify({ type: 'EVENT', data }));
  }, 1000);
  
  // Handle client messages
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'ACK') {
        ws.send(JSON.stringify({ type: 'ACK_RECEIVED', id: parsed.id }));
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Handle upgrade to WebSocket
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Handle server errors
server.on('error', (e) => {
  console.error(`Server error: ${e.message}`);
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try stopping other services.`);
  }
});