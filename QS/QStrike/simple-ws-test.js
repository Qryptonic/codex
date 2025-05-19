#!/usr/bin/env node

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Configuration
const PORT = 3000;
const HOST = 'localhost';
const JOB_ID = 'demo-job'; // Job ID to connect to
const WS_URL = `ws://${HOST}:${PORT}/ws/jobs/${JOB_ID}/stream`;
const JWT_SECRET = 'qstrike-dev-secret';

console.log('Creating JWT token...');
// Create token with subject matching the job ID prefix (the tenant ID)
// This matches the implementation in getClientIdForJob() in server.ts
const token = jwt.sign({ sub: JOB_ID.split('-')[0] }, JWT_SECRET);
console.log('Token:', token);

console.log(`Connecting to ${WS_URL}...`);
const ws = new WebSocket(WS_URL, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

ws.on('open', () => {
  console.log('WebSocket connection established');
  
  // Send a simple message
  ws.send('ping');
  console.log('Sent ping');
  
  // Set a timeout to close the connection after 10 seconds
  setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
    process.exit(0);
  }, 10000);
});

ws.on('message', (data) => {
  if (typeof data === 'string') {
    console.log(`Received text message: ${data}`);
  } else {
    console.log(`Received binary message of ${data.length} bytes`);
    // Try to stringify the binary data for debugging
    try {
      console.log('Binary data:', data);
    } catch (err) {
      console.log('Binary data (raw):', data);
    }
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed: code=${code}, reason=${reason || 'No reason'}`);
  process.exit(0);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Process interrupted');
  if (ws) ws.close();
  process.exit(0);
});