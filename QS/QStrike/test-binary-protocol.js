#!/usr/bin/env node

// Test script to validate the binary WebSocket protocol
const WebSocket = require('ws');
const fs = require('fs');
const avro = require('avsc');
const jwt = require('jsonwebtoken');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const WS_URL = `ws://${HOST}:${PORT}/ws/jobs/test-job/stream`;
const JWT_SECRET = process.env.JWT_SECRET || 'qstrike-dev-secret';
const AVSC_PATH = './src/QuantumEvent.avsc';
const TEST_EVENT_PATH = './test-event.json';

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

console.log(`${colors.cyan}=== QStrike Binary WebSocket Protocol Test ====${colors.reset}`);

// Load Avro schema
console.log(`${colors.blue}Loading Avro schema from ${AVSC_PATH}...${colors.reset}`);
let avroSchema;
try {
  const schemaContent = fs.readFileSync(AVSC_PATH, 'utf8');
  avroSchema = JSON.parse(schemaContent);
  console.log(`${colors.green}✓ Schema loaded successfully${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Error loading schema: ${err.message}${colors.reset}`);
  process.exit(1);
}

// Create Avro type
const avroType = avro.Type.forSchema(avroSchema);
console.log(`${colors.green}✓ Avro type created${colors.reset}`);

// Load test event
console.log(`${colors.blue}Loading test event from ${TEST_EVENT_PATH}...${colors.reset}`);
let testEvent;
try {
  const eventJson = fs.readFileSync(TEST_EVENT_PATH, 'utf8');
  testEvent = JSON.parse(eventJson);
  console.log(`${colors.green}✓ Test event loaded: ${JSON.stringify(testEvent)}${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Error loading test event: ${err.message}${colors.reset}`);
  process.exit(1);
}

// Encode test event to binary
console.log(`${colors.blue}Encoding test event to Avro binary...${colors.reset}`);
const binaryEvent = avroType.toBuffer(testEvent);
console.log(`${colors.green}✓ Test event encoded (${binaryEvent.length} bytes)${colors.reset}`);

// Generate JWT token
console.log(`${colors.blue}Generating JWT token...${colors.reset}`);
const subClaim = testEvent.jobId.split('-')[0] || 'demo'; // Extract client ID from job ID or use "demo"
const token = jwt.sign({ sub: subClaim }, JWT_SECRET);
console.log(`${colors.green}✓ Token generated with sub=${subClaim}${colors.reset}`);

// Create WebSocket connection
console.log(`${colors.blue}Connecting to ${WS_URL}...${colors.reset}`);
const ws = new WebSocket(WS_URL, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

let messageCount = 0;
let ackSent = 0;

ws.on('open', () => {
  console.log(`${colors.green}✓ WebSocket connection established${colors.reset}`);
  
  // Set up automatic ACK every 50 messages
  const ackInterval = setInterval(() => {
    if (messageCount > 0) {
      console.log(`${colors.yellow}→ Sending ACK after ${messageCount} messages${colors.reset}`);
      ws.send('ACK');
      ackSent++;
      messageCount = 0;
    }
  }, 5000);
  
  // Set timeout to close connection
  setTimeout(() => {
    clearInterval(ackInterval);
    console.log(`${colors.magenta}Test completed successfully:${colors.reset}`);
    console.log(`${colors.magenta}- Received ${messageCount} messages in current batch${colors.reset}`);
    console.log(`${colors.magenta}- Sent ${ackSent} ACKs${colors.reset}`);
    ws.close();
    setTimeout(() => process.exit(0), 1000);
  }, 30000);
});

ws.on('message', (data) => {
  // Check if text message (like error)
  if (typeof data === 'string') {
    console.log(`${colors.yellow}← Received text message: ${data}${colors.reset}`);
    return;
  }
  
  // Handle binary message
  try {
    messageCount++;
    const decoded = avroType.fromBuffer(data);
    console.log(`${colors.green}← Received event #${messageCount}: jobId=${decoded.jobId}, ts=${new Date(decoded.ts).toISOString()}, provider=${decoded.provider}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error decoding message: ${err.message}${colors.reset}`);
  }
});

ws.on('error', (error) => {
  console.error(`${colors.red}WebSocket error: ${error.message}${colors.reset}`);
});

ws.on('close', (code, reason) => {
  console.log(`${colors.yellow}WebSocket closed: code=${code}, reason=${reason}${colors.reset}`);
  process.exit(0);
});