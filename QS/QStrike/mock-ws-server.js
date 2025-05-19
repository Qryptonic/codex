#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const PORT = 3000;
const JWT_SECRET = 'qstrike-dev-secret';

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/jobs/demo-job/stream' });

// Handle connections
wss.on('connection', (ws, req) => {
  console.log('Client connected');
  
  // Check authorization header
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header');
    ws.send('ERROR: Authentication failed: Missing token');
    ws.close(4001, 'Auth failed');
    return;
  }
  
  const token = authHeader.split(' ')[1];
  let clientId;
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    clientId = decoded.sub;
    
    if (!clientId) {
      console.log('Missing sub claim in token');
      ws.send('ERROR: Authentication failed: Missing clientId');
      ws.close(4001, 'Missing sub claim');
      return;
    }
    
    // Simple tenant check
    if (clientId !== 'demo') {
      console.log(`Authorization denied: JWT sub claim '${clientId}' does not match job owner 'demo'`);
      ws.send('ERROR: Authorization denied: Tenant isolation violation');
      ws.close(4003, 'Tenant isolation violation');
      return;
    }
    
    console.log(`Authorization successful for client: ${clientId}`);
    
    // Send binary messages to simulate Avro data
    let messageCount = 0;
    let interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Create a random binary buffer (simulating Avro data)
        const buffer = crypto.randomBytes(50);
        ws.send(buffer, { binary: true });
        messageCount++;
        console.log(`Sent binary message #${messageCount} (${buffer.length} bytes)`);
        
        // Stop after 1000 messages
        if (messageCount >= 1000) {
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    // Handle ACK messages from client
    ws.on('message', (message) => {
      try {
        const msgString = message.toString();
        console.log(`Received message from client: ${msgString}`);
        
        if (msgString === 'ACK') {
          console.log('Received ACK from client!');
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });
    
    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`Connection closed: code=${code}, reason=${reason || 'No reason'}`);
      clearInterval(interval);
    });
    
  } catch (err) {
    console.log(`Authentication failed: ${err.message}`);
    ws.send(`ERROR: Authentication failed: ${err.message}`);
    ws.close(4001, 'Auth failed');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Mock WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/jobs/demo-job/stream`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
});