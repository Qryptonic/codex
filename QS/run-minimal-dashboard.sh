#!/bin/bash

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}QStrike Minimal Dashboard Demo${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo

# Create a simple HTML file with the dashboard
DASHBOARD_DIR="/Users/jason/Documents/QS/minimal-dashboard"
mkdir -p "$DASHBOARD_DIR"

# Create the WebSocket server
echo -e "${BLUE}Creating WebSocket server...${NC}"
cat > "$DASHBOARD_DIR/server.js" << 'EOL'
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  } else if (req.url === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    fs.createReadStream(path.join(__dirname, 'style.css')).pipe(res);
  } else if (req.url === '/script.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(path.join(__dirname, 'script.js')).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

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
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
EOL

# Create the HTML file
echo -e "${BLUE}Creating dashboard HTML...${NC}"
cat > "$DASHBOARD_DIR/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QStrike Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>QStrike Dashboard</h1>
      <div class="status-indicator">
        <span id="connection-status">Disconnected</span>
      </div>
    </header>
    
    <main>
      <section class="providers-grid">
        <div class="provider-card" data-provider="IBM">
          <h2>IBM</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Jobs</span>
              <span class="value" id="ibm-jobs">0</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value" id="ibm-success">0%</span>
            </div>
          </div>
        </div>
        
        <div class="provider-card" data-provider="Google">
          <h2>Google</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Jobs</span>
              <span class="value" id="google-jobs">0</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value" id="google-success">0%</span>
            </div>
          </div>
        </div>
        
        <div class="provider-card" data-provider="IonQ">
          <h2>IonQ</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Jobs</span>
              <span class="value" id="ionq-jobs">0</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value" id="ionq-success">0%</span>
            </div>
          </div>
        </div>
        
        <div class="provider-card" data-provider="Quantinuum">
          <h2>Quantinuum</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Jobs</span>
              <span class="value" id="quantinuum-jobs">0</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value" id="quantinuum-success">0%</span>
            </div>
          </div>
        </div>
        
        <div class="provider-card" data-provider="Rigetti">
          <h2>Rigetti</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">Jobs</span>
              <span class="value" id="rigetti-jobs">0</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value" id="rigetti-success">0%</span>
            </div>
          </div>
        </div>
      </section>
      
      <section class="events-panel">
        <h2>Recent Events</h2>
        <div class="events-list" id="events-container">
          <!-- Events will be populated here -->
        </div>
      </section>
    </main>
  </div>
  
  <script src="script.js"></script>
</body>
</html>
EOL

# Create the CSS file
echo -e "${BLUE}Creating dashboard CSS...${NC}"
cat > "$DASHBOARD_DIR/style.css" << 'EOL'
:root {
  --bg-color: #0d0e19;
  --text-color: #eaf2f4;
  --accent-primary: #00e5ff;
  --accent-secondary: #ff00e4;
  --panel-bg: rgba(16, 24, 39, 0.8);
  --card-bg: rgba(30, 41, 59, 0.8);
  --success-color: #00ff9d;
  --error-color: #ff2b5e;
  
  --ibm-color: #0f62fe;
  --google-color: #ea4335;
  --ionq-color: #16dbbe;
  --quantinuum-color: #fcba03;
  --rigetti-color: #6e45e2;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'JetBrains Mono', monospace, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
  position: relative;
  overflow-x: hidden;
}

body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 80% 20%, rgba(0, 229, 255, 0.1), transparent 40%),
    radial-gradient(circle at 20% 80%, rgba(255, 0, 228, 0.1), transparent 40%);
  z-index: -1;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

header h1 {
  color: var(--accent-primary);
  font-size: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.7);
}

.status-indicator {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.status-indicator::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--error-color);
}

.status-indicator.connected::before {
  background-color: var(--success-color);
}

main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 992px) {
  main {
    grid-template-columns: 2fr 1fr;
  }
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.provider-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}

.provider-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.provider-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.provider-card[data-provider="IBM"]::before {
  background: var(--ibm-color);
}

.provider-card[data-provider="Google"]::before {
  background: var(--google-color);
}

.provider-card[data-provider="IonQ"]::before {
  background: var(--ionq-color);
}

.provider-card[data-provider="Quantinuum"]::before {
  background: var(--quantinuum-color);
}

.provider-card[data-provider="Rigetti"]::before {
  background: var(--rigetti-color);
}

.provider-card h2 {
  margin-bottom: 15px;
  font-size: 1.3rem;
  color: var(--accent-primary);
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric .label {
  font-size: 0.75rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metric .value {
  font-size: 1.5rem;
  font-weight: bold;
}

.events-panel {
  background-color: var(--panel-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.events-panel h2 {
  margin-bottom: 20px;
  font-size: 1.3rem;
  color: var(--accent-primary);
}

.events-list {
  overflow-y: auto;
  flex-grow: 1;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-primary) var(--panel-bg);
}

.events-list::-webkit-scrollbar {
  width: 6px;
}

.events-list::-webkit-scrollbar-track {
  background: var(--panel-bg);
}

.events-list::-webkit-scrollbar-thumb {
  background-color: var(--accent-primary);
  border-radius: 6px;
}

.event-item {
  margin-bottom: 15px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 0.9rem;
}

.event-item.success {
  border-left-color: var(--success-color);
}

.event-item.error {
  border-left-color: var(--error-color);
}

.event-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.event-item-provider {
  font-weight: bold;
}

.event-item-time {
  opacity: 0.6;
  font-size: 0.8rem;
}

.event-item-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.event-item-detail {
  display: flex;
  font-size: 0.8rem;
}

.event-item-detail .label {
  opacity: 0.7;
  margin-right: 5px;
}

.event-item-detail .value {
  font-weight: 500;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.8), 0 0 30px rgba(255, 0, 228, 0.3);
  }
  100% {
    box-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
  }
}

.provider-card.active {
  animation: glow 2s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.event-item {
  animation: fadeIn 0.3s ease-out forwards;
}
EOL

# Create the JavaScript file
echo -e "${BLUE}Creating dashboard JavaScript...${NC}"
cat > "$DASHBOARD_DIR/script.js" << 'EOL'
document.addEventListener('DOMContentLoaded', () => {
  const connectionStatus = document.getElementById('connection-status');
  const statusIndicator = document.querySelector('.status-indicator');
  
  // Provider metrics elements
  const providerElements = {
    'IBM': {
      jobs: document.getElementById('ibm-jobs'),
      success: document.getElementById('ibm-success'),
      card: document.querySelector('.provider-card[data-provider="IBM"]')
    },
    'Google': {
      jobs: document.getElementById('google-jobs'),
      success: document.getElementById('google-success'),
      card: document.querySelector('.provider-card[data-provider="Google"]')
    },
    'IonQ': {
      jobs: document.getElementById('ionq-jobs'),
      success: document.getElementById('ionq-success'),
      card: document.querySelector('.provider-card[data-provider="IonQ"]')
    },
    'Quantinuum': {
      jobs: document.getElementById('quantinuum-jobs'),
      success: document.getElementById('quantinuum-success'),
      card: document.querySelector('.provider-card[data-provider="Quantinuum"]')
    },
    'Rigetti': {
      jobs: document.getElementById('rigetti-jobs'),
      success: document.getElementById('rigetti-success'),
      card: document.querySelector('.provider-card[data-provider="Rigetti"]')
    }
  };
  
  const eventsContainer = document.getElementById('events-container');
  
  // Provider statistics
  const providerStats = {
    'IBM': { total: 0, success: 0 },
    'Google': { total: 0, success: 0 },
    'IonQ': { total: 0, success: 0 },
    'Quantinuum': { total: 0, success: 0 },
    'Rigetti': { total: 0, success: 0 }
  };
  
  // WebSocket connection
  const socket = new WebSocket('ws://localhost:3000');
  
  socket.addEventListener('open', () => {
    connectionStatus.textContent = 'Connected';
    statusIndicator.classList.add('connected');
  });
  
  socket.addEventListener('close', () => {
    connectionStatus.textContent = 'Disconnected';
    statusIndicator.classList.remove('connected');
  });
  
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'EVENT') {
        handleEvent(message.data);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  function handleEvent(data) {
    // Update provider statistics
    const provider = data.provider;
    const isSuccess = data.status === 'SUCCESS';
    
    // Update stats
    providerStats[provider].total += 1;
    if (isSuccess) {
      providerStats[provider].success += 1;
    }
    
    // Update UI
    updateProviderUI(provider);
    
    // Add event to the list
    addEventItem(data);
    
    // Highlight the provider card
    highlightProviderCard(provider);
  }
  
  function updateProviderUI(provider) {
    const stats = providerStats[provider];
    const elements = providerElements[provider];
    
    elements.jobs.textContent = stats.total;
    
    const successRate = stats.total > 0 
      ? Math.round((stats.success / stats.total) * 100) 
      : 0;
    
    elements.success.textContent = `${successRate}%`;
  }
  
  function addEventItem(data) {
    const eventItem = document.createElement('div');
    eventItem.className = `event-item ${data.status.toLowerCase()}`;
    
    const timestamp = new Date(data.timestamp);
    const timeString = timestamp.toLocaleTimeString();
    
    eventItem.innerHTML = `
      <div class="event-item-header">
        <span class="event-item-provider">${data.provider}</span>
        <span class="event-item-time">${timeString}</span>
      </div>
      <div class="event-item-details">
        <div class="event-item-detail">
          <span class="label">Status:</span>
          <span class="value">${data.status}</span>
        </div>
        <div class="event-item-detail">
          <span class="label">Algorithm:</span>
          <span class="value">${data.algorithm}</span>
        </div>
        <div class="event-item-detail">
          <span class="label">Qubits:</span>
          <span class="value">${data.qubits}</span>
        </div>
        <div class="event-item-detail">
          <span class="label">Depth:</span>
          <span class="value">${data.circuit_depth}</span>
        </div>
        <div class="event-item-detail">
          <span class="label">Time:</span>
          <span class="value">${data.execution_time_ms}ms</span>
        </div>
        <div class="event-item-detail">
          <span class="label">Error Rate:</span>
          <span class="value">${(data.error_rate * 100).toFixed(2)}%</span>
        </div>
      </div>
    `;
    
    // Add to the beginning of the list
    eventsContainer.insertBefore(eventItem, eventsContainer.firstChild);
    
    // Limit the number of items
    if (eventsContainer.children.length > 20) {
      eventsContainer.removeChild(eventsContainer.lastChild);
    }
  }
  
  function highlightProviderCard(provider) {
    const card = providerElements[provider].card;
    
    // Add active class
    card.classList.add('active');
    
    // Remove active class after animation completes
    setTimeout(() => {
      card.classList.remove('active');
    }, 2000);
  }
});
EOL

# Install ws if needed
echo -e "${BLUE}Installing WebSocket module if needed...${NC}"
cd "$DASHBOARD_DIR"
if ! npm list ws &>/dev/null; then
  npm init -y >/dev/null
  npm install ws >/dev/null
fi

# Start the server
echo -e "${GREEN}Starting QStrike minimal dashboard...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${BLUE}Open http://localhost:3000 in your browser${NC}"

node "$DASHBOARD_DIR/server.js"

# Cleanup function
cleanup() {
  echo -e "${YELLOW}Shutting down...${NC}"
  echo -e "${GREEN}Server stopped${NC}"
  exit 0
}

# Trap Ctrl+C to clean up properly
trap cleanup INT TERM