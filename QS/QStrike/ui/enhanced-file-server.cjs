const http = require('http');
const fs = require('fs');
const path = require('path');

// MIME types for serving static files
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'sample-data.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  console.error(`Error: Data file ${DATA_FILE} not found`);
  process.exit(1);
}

// Load the sample data
let sampleData;
try {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  sampleData = JSON.parse(data);
  console.log(`Loaded sample data from ${DATA_FILE}`);
} catch (error) {
  console.error(`Error loading sample data: ${error.message}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  console.log('Request received for:', req.url);
  
  // Handle SSE endpoint for real-time data simulation
  if (req.url === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Function to send an event with slight variations to simulate realtime changes
    const sendEvent = () => {
      // Make a deep copy of the data to avoid modifying the original
      const data = JSON.parse(JSON.stringify(sampleData));
      
      // Add small variations to data to simulate real-time changes
      // TTB metrics - small random fluctuations in current values
      Object.keys(data.ttb_metrics.current).forEach(key => {
        const variation = Math.random() * 0.05 - 0.025; // ±2.5%
        data.ttb_metrics.current[key] *= (1 + variation);
      });
      
      // Grover metrics - vary the calls per second
      data.grover_metrics.calls_per_sec *= (1 + (Math.random() * 0.1 - 0.05)); // ±5%
      
      // Shor workflow - slowly increment progress
      data.shor_workflow.stages.forEach(stage => {
        if (stage.pct_complete < 1) {
          stage.pct_complete = Math.min(1, stage.pct_complete + Math.random() * 0.01);
        }
      });
      
      // Fidelity - small variations
      data.fidelity.avg_fidelity *= (1 + (Math.random() * 0.002 - 0.001)); // ±0.1%
      
      // Job status - occasional changes
      if (Math.random() > 0.7) {
        // 30% chance to change job counts
        const changeAmount = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        data.job_status.running = Math.max(0, data.job_status.running + changeAmount);
        data.job_status.queued = Math.max(0, data.job_status.queued + (Math.floor(Math.random() * 3) - 1));
      }
      
      // Set current timestamp
      data.timestamp = new Date().toISOString();
      
      // Send the event
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Send initial data
    sendEvent();
    
    // Send periodic updates
    const intervalId = setInterval(sendEvent, 2000);
    
    // Clean up on close
    req.on('close', () => {
      clearInterval(intervalId);
      console.log('SSE connection closed');
    });
    
    return;
  }
  
  // Serve sample data as a static file
  if (req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sampleData));
    return;
  }
  
  // For the root or index.html request, serve the dashboard
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>QStrike™ Enhanced Security Dashboard</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            :root {
              /* Core Colors */
              --color-bg-darkest: #080a17;
              --color-bg-dark: #0f1325;
              --color-bg-card: #121936;
              --color-accent-primary: #00a2ff;
              --color-accent-secondary: #53ffa9;
              --color-accent-tertiary: #8C46FF;
              --color-text-primary: #ffffff;
              --color-text-secondary: #a0a7c4;
              --color-border: #1c2951;
              --color-error: #ff4757;
              --color-warning: #ffa502;
              --color-success: #2ed573;
              
              /* Advanced Colors */
              --color-accent-primary-glow: rgba(0, 162, 255, 0.2);
              --color-accent-secondary-glow: rgba(83, 255, 169, 0.2);
              --color-gradient-blue: linear-gradient(135deg, #00a2ff, #0057ff);
              --color-gradient-green: linear-gradient(135deg, #53ffa9, #05ffb1);
              --color-gradient-purple: linear-gradient(135deg, #8C46FF, #6E00FF);
              
              /* Shadows */
              --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.35);
              --shadow-hover: 0 8px 30px rgba(0, 162, 255, 0.2);
              --shadow-success: 0 8px 30px rgba(46, 213, 115, 0.2);
              --shadow-warning: 0 8px 30px rgba(255, 165, 2, 0.2);
              --shadow-error: 0 8px 30px rgba(255, 71, 87, 0.2);
              
              /* Animation */
              --transition-quick: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
              
              /* Spacing */
              --spacing-xs: 4px;
              --spacing-sm: 8px;
              --spacing-md: 16px;
              --spacing-lg: 24px;
              --spacing-xl: 32px;
              
              /* Typography */
              --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              --font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;
            }
            
            @keyframes glow {
              0% { box-shadow: 0 0 5px var(--color-accent-primary-glow); }
              50% { box-shadow: 0 0 15px var(--color-accent-primary-glow); }
              100% { box-shadow: 0 0 5px var(--color-accent-primary-glow); }
            }
            
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
            
            @keyframes scan {
              0% { transform: translateY(0); opacity: 0; }
              10% { opacity: 0.5; }
              90% { opacity: 0.5; }
              100% { transform: translateY(100%); opacity: 0; }
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: var(--font-sans);
              background-color: var(--color-bg-darkest);
              color: var(--color-text-primary);
              line-height: 1.5;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            .dashboard-container {
              max-width: 1600px;
              margin: 0 auto;
              padding: var(--spacing-md);
            }
            
            header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: var(--spacing-lg);
              padding-bottom: var(--spacing-md);
              border-bottom: 1px solid var(--color-border);
            }
            
            .logo-container {
              display: flex;
              align-items: center;
            }
            
            .logo-text {
              font-size: 24px;
              font-weight: 700;
              background: linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-left: var(--spacing-sm);
            }
            
            .logo {
              position: relative;
            }
            
            .logo svg {
              position: relative;
              z-index: 1;
            }
            
            .logo::after {
              content: "";
              position: absolute;
              top: -5px;
              left: -5px;
              right: -5px;
              bottom: -5px;
              background: radial-gradient(circle, var(--color-accent-primary-glow) 0%, rgba(0,0,0,0) 70%);
              border-radius: 50%;
              z-index: 0;
              animation: pulse 3s infinite;
            }
            
            .client-info {
              text-align: right;
            }
            
            .client-name {
              font-size: 18px;
              font-weight: 600;
            }
            
            .environment {
              font-size: 14px;
              color: var(--color-accent-primary);
              position: relative;
              display: inline-block;
              padding-left: 12px;
            }
            
            .environment::before {
              content: "";
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: var(--color-accent-primary);
              animation: pulse 2s infinite;
            }
            
            .dashboard-controls {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: var(--spacing-md);
            }
            
            .refresh-control {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);
              font-size: 14px;
              color: var(--color-text-secondary);
            }
            
            .time-display {
              padding: var(--spacing-xs) var(--spacing-sm);
              background-color: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              font-family: var(--font-mono);
              font-size: 12px;
            }
            
            .dashboard-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 300px);
              gap: var(--spacing-md);
            }
            
            .card {
              background-color: var(--color-bg-card);
              border-radius: 12px;
              box-shadow: var(--shadow-card);
              padding: var(--spacing-md);
              display: flex;
              flex-direction: column;
              transition: transform var(--transition-bounce), box-shadow var(--transition-normal);
              position: relative;
              overflow: hidden;
              border: 1px solid var(--color-border);
            }
            
            .card:hover {
              box-shadow: var(--shadow-hover);
              transform: translateY(-4px);
              border-color: var(--color-accent-primary);
            }
            
            .card.critical:hover {
              box-shadow: var(--shadow-error);
              border-color: var(--color-error);
            }
            
            .card::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, 
                rgba(0,0,0,0) 0%, 
                var(--color-accent-primary) 50%, 
                rgba(0,0,0,0) 100%);
              transform: translateY(-1px);
              transition: transform var(--transition-normal);
              opacity: 0;
            }
            
            .card:hover::before {
              opacity: 1;
              transform: translateY(0);
            }
            
            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: var(--spacing-md);
            }
            
            .card-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--color-text-primary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .card-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
            }
            
            .scan-line {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, 
                rgba(0,162,255,0) 0%, 
                rgba(0,162,255,0.8) 50%, 
                rgba(0,162,255,0) 100%);
              z-index: 10;
              opacity: 0.6;
              animation: scan 8s infinite;
              pointer-events: none;
            }
            
            .loading-indicator {
              display: inline-block;
              width: 50px;
              height: 50px;
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-radius: 50%;
              border-top-color: var(--color-accent-primary);
              animation: spin 1s ease-in-out infinite;
            }
            
            /* Component-specific styles */
            
            /* Heat Matrix */
            .heat-matrix {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 8px;
              width: 100%;
              height: 100%;
            }
            
            .heat-cell {
              border-radius: 6px;
              transition: all var(--transition-normal);
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              font-size: 14px;
              position: relative;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .heat-cell::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
              pointer-events: none;
            }
            
            .heat-cell:hover {
              transform: scale(1.05);
              z-index: 1;
            }
            
            /* Gauge Styling */
            .gauge-container {
              position: relative;
              width: 200px;
              height: 100px;
              overflow: hidden;
            }
            
            .gauge-arc {
              position: absolute;
              width: 200px;
              height: 200px;
              border-radius: 50%;
              background: conic-gradient(
                var(--color-accent-primary) 0%,
                var(--color-accent-secondary) var(--percentage),
                transparent var(--percentage)
              );
              clip-path: polygon(0 100%, 100% 100%, 100% 0, 0 0);
              transform: rotate(-90deg);
              filter: drop-shadow(0 0 8px var(--color-accent-primary-glow));
            }
            
            .gauge-value {
              position: absolute;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              text-shadow: 0 0 10px var(--color-accent-primary-glow);
            }
            
            .gauge-label {
              position: absolute;
              bottom: -10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 12px;
              color: var(--color-text-secondary);
            }
            
            /* Bar Chart */
            .bar-chart {
              width: 100%;
              height: 200px;
              display: flex;
              align-items: flex-end;
              justify-content: space-around;
              padding-bottom: 20px;
              position: relative;
            }
            
            .bar-chart::after {
              content: "";
              position: absolute;
              left: 0;
              right: 0;
              bottom: 0;
              height: 1px;
              background-color: rgba(255,255,255,0.1);
            }
            
            .bar {
              width: 30px;
              background: linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary));
              border-radius: 4px 4px 0 0;
              transition: height var(--transition-normal);
              position: relative;
              box-shadow: 0 0 10px var(--color-accent-primary-glow);
            }
            
            .bar::before {
              content: attr(data-value);
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 10px;
              color: var(--color-text-secondary);
            }
            
            /* Progress Container */
            .progress-container {
              width: 100%;
              height: 24px;
              background-color: var(--color-bg-dark);
              border-radius: 12px;
              overflow: hidden;
              margin: 8px 0;
              position: relative;
            }
            
            .progress-bar {
              height: 100%;
              background: linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary));
              border-radius: 12px;
              transition: width var(--transition-normal);
              position: relative;
            }
            
            .progress-bar::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(
                90deg,
                rgba(255,255,255,0) 0%,
                rgba(255,255,255,0.1) 50%,
                rgba(255,255,255,0) 100%
              );
              animation: pulse 2s infinite;
            }
            
            /* Workflow Stages */
            .workflow-stages {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .stage {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              border-radius: 6px;
              background-color: var(--color-bg-dark);
              transition: all var(--transition-normal);
              position: relative;
              overflow: hidden;
            }
            
            .stage.complete {
              background-color: rgba(46, 213, 115, 0.1);
              border-left: 4px solid var(--color-success);
            }
            
            .stage.active {
              background-color: rgba(0, 162, 255, 0.1);
              border-left: 4px solid var(--color-accent-primary);
              animation: glow 2s infinite;
            }
            
            .stage-indicator {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              margin-right: 12px;
              background-color: var(--color-bg-dark);
              position: relative;
            }
            
            .stage.complete .stage-indicator {
              background-color: var(--color-success);
            }
            
            .stage.active .stage-indicator {
              background-color: var(--color-accent-primary);
            }
            
            .stage.active .stage-indicator::after {
              content: "";
              position: absolute;
              top: -4px;
              left: -4px;
              right: -4px;
              bottom: -4px;
              border-radius: 50%;
              border: 1px solid var(--color-accent-primary);
              animation: pulse 2s infinite;
            }
            
            /* Vulnerable Systems */
            .vulnerable-systems {
              width: 100%;
              overflow: auto;
              max-height: 100%;
              padding-right: var(--spacing-sm);
            }
            
            .system-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.05);
              transition: background-color var(--transition-quick);
            }
            
            .system-item:last-child {
              border-bottom: none;
            }
            
            .system-item:hover {
              background-color: rgba(255,255,255,0.03);
            }
            
            .system-name {
              font-weight: 500;
              flex: 1;
            }
            
            .risk-indicator {
              width: 80px;
              height: 8px;
              border-radius: 4px;
              background-color: var(--color-bg-dark);
              overflow: hidden;
              margin-left: var(--spacing-md);
            }
            
            .risk-level {
              height: 100%;
              transition: width var(--transition-normal);
            }
            
            /* Status Indicator */
            .status-indicator {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 24px;
              font-weight: bold;
              transition: all var(--transition-normal);
              position: relative;
            }
            
            .status-indicator::before {
              content: "";
              position: absolute;
              top: -5px;
              left: -5px;
              right: -5px;
              bottom: -5px;
              border-radius: 50%;
              border: 1px solid currentColor;
              opacity: 0.3;
            }
            
            .status-indicator::after {
              content: "";
              position: absolute;
              top: -10px;
              left: -10px;
              right: -10px;
              bottom: -10px;
              border-radius: 50%;
              border: 1px solid currentColor;
              opacity: 0.1;
            }
            
            .status-indicator.active {
              animation: pulse 2s infinite;
            }
            
            /* Test Status */
            .test-status {
              display: flex;
              justify-content: space-around;
              width: 100%;
            }
            
            .status-group {
              text-align: center;
              flex: 1;
              padding: var(--spacing-sm);
              border-radius: 8px;
              transition: background-color var(--transition-quick);
            }
            
            .status-group:hover {
              background-color: rgba(255,255,255,0.03);
            }
            
            .status-value {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: var(--spacing-xs);
            }
            
            .status-label {
              font-size: 14px;
              color: var(--color-text-secondary);
            }
            
            /* Compliance Grid */
            .compliance-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              width: 100%;
            }
            
            .compliance-item {
              display: flex;
              align-items: center;
              padding: 8px;
              background-color: rgba(255,255,255,0.03);
              border-radius: 6px;
              transition: transform var(--transition-quick);
            }
            
            .compliance-item:hover {
              transform: translateY(-2px);
            }
            
            .compliance-status {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              margin-right: 8px;
            }
            
            .compliance-name {
              font-size: 12px;
              font-weight: 500;
              flex: 1;
            }
            
            /* Footer */
            footer {
              margin-top: var(--spacing-lg);
              padding-top: var(--spacing-md);
              border-top: 1px solid var(--color-border);
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: var(--color-text-secondary);
            }
            
            /* Responsive styles */
            @media (max-width: 1400px) {
              .dashboard-grid {
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(5, 300px);
              }
              
              .card:nth-child(9) {
                grid-column: span 2;
              }
            }
            
            @media (max-width: 900px) {
              .dashboard-grid {
                grid-template-columns: 1fr;
                grid-template-rows: repeat(9, 300px);
              }
              
              .card:nth-child(9) {
                grid-column: span 1;
              }
              
              header {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--spacing-md);
              }
              
              .client-info {
                text-align: left;
              }
            }
          </style>
        </head>
        <body>
          <div class="dashboard-container">
            <header>
              <div class="logo-container">
                <div class="logo">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5Z" stroke="#00A2FF" stroke-width="2"/>
                    <path d="M20 11C14.4772 11 10 15.4772 10 21C10 26.5228 14.4772 31 20 31C25.5228 31 30 26.5228 30 21C30 15.4772 25.5228 11 20 11Z" stroke="#53FFA9" stroke-width="2"/>
                    <path d="M20 2V38" stroke="#00A2FF" stroke-width="2"/>
                    <path d="M2 20H38" stroke="#53FFA9" stroke-width="2"/>
                  </svg>
                </div>
                <div class="logo-text">QStrike™ Security Dashboard</div>
              </div>
              <div class="client-info">
                <div class="client-name">Enterprise Client</div>
                <div class="environment">Production Environment</div>
              </div>
            </header>
            
            <div class="dashboard-controls">
              <div class="refresh-control">
                <span>Auto-refresh:</span>
                <span class="time-display">2s</span>
              </div>
              <div class="time-display" id="current-time">--:--:--</div>
            </div>
            
            <div class="dashboard-grid">
              <!-- Card 1: Time-to-Break Trend -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Time-to-Break Trend</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="bar-chart" id="ttb-chart">
                    <!-- Bars will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Card 2: Risk Heatmap -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Risk Heatmap</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="heat-matrix" id="risk-matrix">
                    <!-- Matrix cells will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Card 3: Top Vulnerable Systems -->
              <div class="card critical">
                <div class="card-header">
                  <div class="card-title">Top Vulnerable Systems</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="vulnerable-systems" id="vulnerable-systems">
                    <!-- System items will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Card 4: Quantum Orchestra Conductor -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Quantum Orchestra Conductor</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div id="quantum-orchestra">
                    <div class="status-indicator active" id="conductor-status">
                      <!-- Status will be updated dynamically -->
                    </div>
                    <div id="aggregate-power" style="margin-top: 20px; text-align: center; font-size: 14px;"></div>
                  </div>
                </div>
              </div>
              
              <!-- Card 5: Shor's Algorithm Workflow -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Shor's Algorithm Workflow</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="workflow-stages" id="algorithm-workflow">
                    <!-- Workflow stages will be added dynamically -->
                  </div>
                  <div id="shor-eta" style="margin-top: 15px; text-align: center; font-size: 14px;"></div>
                </div>
              </div>
              
              <!-- Card 6: Grover's Speedometer -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Grover's Speedometer</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="gauge-container" id="grover-gauge">
                    <div class="gauge-arc"></div>
                    <div class="gauge-value">0</div>
                    <div class="gauge-label">calls per second</div>
                  </div>
                  <div id="grover-error" style="margin-top: 15px; text-align: center; font-size: 14px;"></div>
                </div>
              </div>
              
              <!-- Card 7: Simulation Fidelity Gauge -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Simulation Fidelity Gauge</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="gauge-container" id="fidelity-gauge">
                    <div class="gauge-arc"></div>
                    <div class="gauge-value">0%</div>
                    <div class="gauge-label">cross-validation accuracy</div>
                  </div>
                </div>
              </div>
              
              <!-- Card 8: Active Test Status & SLA -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Active Test Status & SLA</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div class="test-status" id="test-status">
                    <!-- Test status will be added dynamically -->
                  </div>
                  <div id="sla-status" style="margin-top: 20px; text-align: center;"></div>
                </div>
              </div>
              
              <!-- Card 9: Compliance & PQC Migration Progress -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Compliance & PQC Migration</div>
                </div>
                <div class="card-content">
                  <div class="scan-line"></div>
                  <div id="compliance-container" style="height: 40%; margin-bottom: 15px;"></div>
                  <div id="pqc-container" style="height: 60%;"></div>
                </div>
              </div>
            </div>
            
            <footer>
              <div>QStrike™ Security Dashboard v5.1</div>
              <div>Last updated: <span id="last-updated">Connecting...</span></div>
            </footer>
          </div>
          
          <script>
            // Connect to SSE endpoint for real-time updates
            const eventSource = new EventSource('/api/stream');
            let lastUpdate = new Date();
            
            // Update current time display
            function updateCurrentTime() {
              const now = new Date();
              document.getElementById('current-time').textContent = now.toLocaleTimeString();
            }
            setInterval(updateCurrentTime, 1000);
            updateCurrentTime();
            
            // Update the dashboard with the latest data
            eventSource.onmessage = function(event) {
              const data = JSON.parse(event.data);
              lastUpdate = new Date();
              document.getElementById('last-updated').textContent = lastUpdate.toLocaleTimeString();
              
              // Update Time-to-Break Trend
              updateTTBChart(data.ttb_metrics);
              
              // Update Risk Heatmap
              updateRiskMatrix(data.risk_matrix);
              
              // Update Vulnerable Systems
              updateVulnerableSystems(data.vulnerable_systems);
              
              // Update Quantum Orchestra
              updateQuantumOrchestra(data.quantum_orchestra);
              
              // Update Shor's Algorithm Workflow
              updateShorWorkflow(data.shor_workflow);
              
              // Update Grover's Speedometer
              updateGroverGauge(data.grover_metrics);
              
              // Update Fidelity Gauge
              updateFidelityGauge(data.fidelity);
              
              // Update Test Status
              updateTestStatus(data.job_status);
              
              // Update Compliance & PQC Migration
              updateComplianceAndPQC(data.compliance);
            };
            
            // Handle connection errors
            eventSource.onerror = function() {
              console.error('SSE connection error');
              document.getElementById('last-updated').textContent = 'Connection error';
            };
            
            // Helper function to format time values
            function formatTimeToBreak(seconds) {
              if (seconds >= 86400) { // More than a day
                return (seconds / 86400).toFixed(1) + 'd';
              } else if (seconds >= 3600) { // More than an hour
                return (seconds / 3600).toFixed(1) + 'h';
              } else if (seconds >= 60) { // More than a minute
                return (seconds / 60).toFixed(1) + 'm';
              } else {
                return seconds + 's';
              }
            }
            
            // Function to update the Time-to-Break Trend chart
            function updateTTBChart(data) {
              if (!data || !data.history || data.history.length === 0) return;
              
              const chartContainer = document.getElementById('ttb-chart');
              chartContainer.innerHTML = '';
              
              // Only use the last 7 data points for clarity
              const recentData = data.history.slice(-7);
              
              // Get max value for scaling
              const allValues = recentData.flatMap(item => [
                item.RSA2048 || 0, 
                item.ECCP256 || 0, 
                item.AES128 || 0, 
                item.MD5 || 0
              ]);
              const maxValue = Math.max(...allValues);
              
              // Create one group for each algorithm
              const algorithms = ['RSA2048', 'ECCP256', 'AES128', 'MD5'];
              const colors = {
                'RSA2048': 'rgba(255, 71, 87, 0.8)',
                'ECCP256': 'rgba(255, 165, 2, 0.8)',
                'AES128': 'rgba(0, 162, 255, 0.8)',
                'MD5': 'rgba(140, 70, 255, 0.8)'
              };
              
              algorithms.forEach(algo => {
                const barGroup = document.createElement('div');
                barGroup.className = 'bar-group';
                barGroup.style.display = 'flex';
                barGroup.style.flexDirection = 'column';
                barGroup.style.alignItems = 'center';
                barGroup.style.gap = '5px';
                
                // Create a label for the algorithm
                const label = document.createElement('div');
                label.style.fontSize = '12px';
                label.style.color = colors[algo];
                label.style.fontWeight = 'bold';
                label.textContent = algo;
                
                // Create a bar showing the current value
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.backgroundColor = colors[algo];
                
                // Get current value from latest data point
                const value = data.current[algo] || recentData[recentData.length - 1][algo] || 0;
                bar.style.height = \`\${(value / maxValue) * 100}%\`;
                
                // Add formatted TTB value as a data attribute for tooltip
                bar.dataset.value = formatTimeToBreak(value);
                
                barGroup.appendChild(bar);
                barGroup.appendChild(label);
                chartContainer.appendChild(barGroup);
              });
            }
            
            // Function to update the Risk Heatmap
            function updateRiskMatrix(data) {
              if (!data || !data.cells || data.cells.length === 0) return;
              
              const matrixContainer = document.getElementById('risk-matrix');
              matrixContainer.innerHTML = '';
              
              // Get unique assets and crypto types
              const cells = data.cells;
              const assets = [...new Set(cells.map(cell => cell.asset))].slice(0, 3);
              const cryptoTypes = [...new Set(cells.map(cell => cell.crypto))].slice(0, 3);
              
              // Create the matrix
              for (let i = 0; i < assets.length; i++) {
                for (let j = 0; j < cryptoTypes.length; j++) {
                  const cell = document.createElement('div');
                  cell.className = 'heat-cell';
                  
                  // Find the matching data
                  const cellData = cells.find(c => c.asset === assets[i] && c.crypto === cryptoTypes[j]);
                  
                  if (cellData) {
                    // Color based on risk level
                    let color;
                    switch (cellData.level) {
                      case 'High':
                        color = 'rgba(255, 71, 87, 0.8)';
                        break;
                      case 'Medium':
                        color = 'rgba(255, 165, 2, 0.8)';
                        break;
                      case 'Low':
                        color = 'rgba(46, 213, 115, 0.8)';
                        break;
                      default:
                        color = 'rgba(150, 150, 150, 0.5)';
                    }
                    
                    cell.style.backgroundColor = color;
                    
                    // Add asset and crypto type as data attributes for tooltip
                    cell.dataset.asset = cellData.asset;
                    cell.dataset.crypto = cellData.crypto;
                    cell.dataset.level = cellData.level;
                    cell.dataset.ttb = formatTimeToBreak(cellData.ttb_sec);
                    
                    // Show abbreviated asset and crypto names
                    const assetShort = cellData.asset.split('_')[0];
                    const cryptoShort = cellData.crypto.replace(/[0-9]+/g, '');
                    cell.innerHTML = \`<div style="font-size:10px;opacity:0.7;">\${assetShort}</div><div>\${cryptoShort}</div>\`;
                    
                    // Add tooltip on hover
                    cell.title = \`\${cellData.asset} + \${cellData.crypto}\\n\${cellData.level} Risk (\${formatTimeToBreak(cellData.ttb_sec)})\`;
                  } else {
                    cell.style.backgroundColor = 'rgba(50, 50, 50, 0.2)';
                    cell.textContent = '—';
                  }
                  
                  matrixContainer.appendChild(cell);
                }
              }
            }
            
            // Function to update the Vulnerable Systems list
            function updateVulnerableSystems(data) {
              if (!data || data.length === 0) return;
              
              const systemsContainer = document.getElementById('vulnerable-systems');
              systemsContainer.innerHTML = '';
              
              // Take top 5 for visibility
              const topSystems = data.slice(0, 5);
              
              topSystems.forEach(system => {
                const systemItem = document.createElement('div');
                systemItem.className = 'system-item';
                
                const nameElement = document.createElement('div');
                nameElement.className = 'system-name';
                nameElement.textContent = system.asset;
                
                const ttbElement = document.createElement('div');
                ttbElement.style.fontSize = '12px';
                ttbElement.style.marginRight = '10px';
                ttbElement.style.opacity = '0.7';
                ttbElement.textContent = formatTimeToBreak(system.ttb_sec);
                
                const riskContainer = document.createElement('div');
                riskContainer.className = 'risk-indicator';
                
                const riskLevel = document.createElement('div');
                riskLevel.className = 'risk-level';
                riskLevel.style.width = \`\${system.risk_score * 100}%\`;
                
                // Color based on priority
                let color;
                switch (system.priority) {
                  case 'Urgent':
                    color = 'var(--color-error)';
                    break;
                  case 'High':
                    color = 'var(--color-warning)';
                    break;
                  case 'Medium':
                    color = 'rgba(0, 162, 255, 0.8)';
                    break;
                  default:
                    color = 'var(--color-success)';
                }
                
                riskLevel.style.backgroundColor = color;
                
                riskContainer.appendChild(riskLevel);
                systemItem.appendChild(nameElement);
                systemItem.appendChild(ttbElement);
                systemItem.appendChild(riskContainer);
                systemsContainer.appendChild(systemItem);
                
                // Add tooltip
                systemItem.title = \`\${system.asset} [\${system.crypto}]\\nRisk Score: \${(system.risk_score * 100).toFixed(1)}%\\nTime to Break: \${formatTimeToBreak(system.ttb_sec)}\\nPriority: \${system.priority}\`;
              });
            }
            
            // Function to update the Quantum Orchestra
            function updateQuantumOrchestra(data) {
              if (!data) return;
              
              const statusIndicator = document.getElementById('conductor-status');
              const aggregatePowerElement = document.getElementById('aggregate-power');
              
              // Update status indicator
              statusIndicator.textContent = data.aggregate_power > 100000 ? 'ACTIVE' : 'STANDBY';
              statusIndicator.style.backgroundColor = data.aggregate_power > 100000 ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 165, 2, 0.2)';
              statusIndicator.style.border = \`2px solid \${data.aggregate_power > 100000 ? 'var(--color-success)' : 'var(--color-warning)'}\`;
              statusIndicator.style.color = data.aggregate_power > 100000 ? 'var(--color-success)' : 'var(--color-warning)';
              
              // Update aggregate power
              aggregatePowerElement.innerHTML = \`
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                  \${(data.aggregate_power / 1000).toFixed(1)}K
                </div>
                <div style="font-size: 12px; opacity: 0.7;">Effective Qubit Power</div>
              \`;
              
              // Create a tooltip with provider details
              let tooltip = 'Active Providers:\\n';
              data.providers.forEach(provider => {
                tooltip += \`\${provider.name}: \${provider.qubits} qubits, \${provider.job_count} jobs\\n\`;
              });
              
              statusIndicator.title = tooltip;
              aggregatePowerElement.title = tooltip;
            }
            
            // Function to update the Shor's Algorithm Workflow
            function updateShorWorkflow(data) {
              if (!data || !data.stages) return;
              
              const workflowContainer = document.getElementById('algorithm-workflow');
              const etaElement = document.getElementById('shor-eta');
              workflowContainer.innerHTML = '';
              
              data.stages.forEach(stageData => {
                const stage = document.createElement('div');
                
                // Determine if stage is complete or active
                const isComplete = stageData.pct_complete >= 1;
                const isActive = !isComplete && stageData.pct_complete > 0;
                
                stage.className = \`stage \${isComplete ? 'complete' : ''} \${isActive ? 'active' : ''}\`;
                
                const indicator = document.createElement('div');
                indicator.className = 'stage-indicator';
                
                const nameContainer = document.createElement('div');
                nameContainer.style.display = 'flex';
                nameContainer.style.justifyContent = 'space-between';
                nameContainer.style.width = '100%';
                
                const name = document.createElement('div');
                name.className = 'stage-name';
                name.textContent = stageData.name;
                
                const progress = document.createElement('div');
                progress.style.fontSize = '12px';
                progress.style.opacity = '0.7';
                progress.textContent = \`\${Math.round(stageData.pct_complete * 100)}%\`;
                
                nameContainer.appendChild(name);
                nameContainer.appendChild(progress);
                
                stage.appendChild(indicator);
                stage.appendChild(nameContainer);
                workflowContainer.appendChild(stage);
              });
              
              // Update ETA
              const hoursRemaining = data.eta_sec / 3600;
              etaElement.innerHTML = \`
                <div style="font-weight: bold;">Target: \${data.target}</div>
                <div>ETA: \${hoursRemaining.toFixed(1)} hours</div>
              \`;
            }
            
            // Function to update Grover's Speedometer
            function updateGroverGauge(data) {
              if (!data) return;
              
              const gaugeArc = document.getElementById('grover-gauge').querySelector('.gauge-arc');
              const gaugeValue = document.getElementById('grover-gauge').querySelector('.gauge-value');
              const errorElement = document.getElementById('grover-error');
              
              // Calculate percentage based on calls per second (normalize to 2M CPS)
              const maxCPS = 2000000;
              const percentage = Math.min(100, (data.calls_per_sec / maxCPS) * 100);
              
              // Format CPS for display
              const formattedCPS = data.calls_per_sec >= 1000000 
                ? (data.calls_per_sec / 1000000).toFixed(2) + 'M'
                : (data.calls_per_sec / 1000).toFixed(0) + 'K';
              
              // Update gauge
              gaugeArc.style.setProperty('--percentage', \`\${percentage}%\`);
              gaugeValue.textContent = formattedCPS;
              
              // Update error rate
              errorElement.innerHTML = \`
                <div>
                  Target: \${data.target} 
                  <span style="margin-left: 10px; padding: 2px 6px; border-radius: 4px; background-color: rgba(255,255,255,0.1); font-size: 12px;">
                    Error: \${(data.error_rate * 100).toFixed(2)}%
                  </span>
                </div>
              \`;
            }
            
            // Function to update Fidelity Gauge
            function updateFidelityGauge(data) {
              if (!data) return;
              
              const gaugeArc = document.getElementById('fidelity-gauge').querySelector('.gauge-arc');
              const gaugeValue = document.getElementById('fidelity-gauge').querySelector('.gauge-value');
              
              // Calculate percentage (scale to 90-100%)
              const scaledFidelity = (data.avg_fidelity - 0.9) * 10; // Convert 0.9-1.0 to 0-100%
              const percentage = Math.max(0, Math.min(100, scaledFidelity * 100));
              
              // Update gauge
              gaugeArc.style.setProperty('--percentage', \`\${percentage}%\`);
              gaugeValue.textContent = (data.avg_fidelity * 100).toFixed(1) + '%';
              
              // Set color based on fidelity level
              let color;
              if (data.avg_fidelity >= 0.99) {
                color = 'var(--color-success)';
              } else if (data.avg_fidelity >= 0.95) {
                color = 'var(--color-warning)';
              } else {
                color = 'var(--color-error)';
              }
              
              gaugeArc.style.background = \`conic-gradient(
                \${color} 0%,
                \${color} var(--percentage),
                transparent var(--percentage)
              )\`;
              
              // Create tooltip with provider details
              if (data.providers) {
                let tooltip = 'Provider Fidelity:\\n';
                Object.entries(data.providers).forEach(([provider, fidelity]) => {
                  tooltip += \`\${provider}: \${(fidelity * 100).toFixed(1)}%\\n\`;
                });
                
                gaugeValue.title = tooltip;
              }
            }
            
            // Function to update Test Status
            function updateTestStatus(data) {
              if (!data) return;
              
              const statusContainer = document.getElementById('test-status');
              const slaElement = document.getElementById('sla-status');
              statusContainer.innerHTML = '';
              
              const groups = [
                { label: 'Running', value: data.running, color: 'var(--color-accent-primary)' },
                { label: 'Queued', value: data.queued, color: 'var(--color-warning)' },
                { label: 'Failed', value: data.failed, color: 'var(--color-error)' }
              ];
              
              groups.forEach(group => {
                const groupElement = document.createElement('div');
                groupElement.className = 'status-group';
                
                const valueElement = document.createElement('div');
                valueElement.className = 'status-value';
                valueElement.textContent = group.value;
                valueElement.style.color = group.color;
                
                const labelElement = document.createElement('div');
                labelElement.className = 'status-label';
                labelElement.textContent = group.label;
                
                groupElement.appendChild(valueElement);
                groupElement.appendChild(labelElement);
                statusContainer.appendChild(groupElement);
              });
              
              // Update SLA
              slaElement.innerHTML = \`
                <div style="font-size: 14px; opacity: 0.7;">SLA Compliance</div>
                <div style="font-size: 24px; font-weight: bold; color: \${data.sla_pct >= 99 ? 'var(--color-success)' : 'var(--color-warning)'};">
                  \${data.sla_pct.toFixed(1)}%
                </div>
              \`;
            }
            
            // Function to update Compliance & PQC Migration
            function updateComplianceAndPQC(data) {
              if (!data || !data.frameworks || !data.pqc_migration) return;
              
              const complianceContainer = document.getElementById('compliance-container');
              const pqcContainer = document.getElementById('pqc-container');
              
              // Update Compliance
              complianceContainer.innerHTML = \`
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Compliance Status</div>
                <div class="compliance-grid"></div>
              \`;
              
              const complianceGrid = complianceContainer.querySelector('.compliance-grid');
              
              data.frameworks.forEach(framework => {
                const item = document.createElement('div');
                item.className = 'compliance-item';
                
                const status = document.createElement('div');
                status.className = 'compliance-status';
                status.style.backgroundColor = framework.status === 'pass' ? 'var(--color-success)' : 'var(--color-error)';
                
                const name = document.createElement('div');
                name.className = 'compliance-name';
                name.textContent = framework.name;
                
                item.appendChild(status);
                item.appendChild(name);
                item.title = \`\${framework.name}: \${framework.status === 'pass' ? 'Compliant' : 'Non-Compliant'}\\nLast check: \${new Date(framework.last_check).toLocaleString()}\`;
                
                complianceGrid.appendChild(item);
              });
              
              // Update PQC Migration
              pqcContainer.innerHTML = \`
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Post-Quantum Crypto Migration</div>
                <div id="pqc-progress"></div>
              \`;
              
              const pqcProgress = pqcContainer.querySelector('#pqc-progress');
              
              // Group by algorithm
              const algGroups = {};
              data.pqc_migration.forEach(item => {
                if (!algGroups[item.algorithm]) {
                  algGroups[item.algorithm] = [];
                }
                algGroups[item.algorithm].push(item);
              });
              
              // Get environment colors
              const envColors = {
                'dev': 'var(--color-accent-primary)',
                'stage': 'var(--color-warning)',
                'prod': 'var(--color-success)'
              };
              
              // Create a progress bar for each algorithm and environment
              Object.entries(algGroups).forEach(([alg, items]) => {
                const algContainer = document.createElement('div');
                algContainer.style.marginBottom = '15px';
                
                const algTitle = document.createElement('div');
                algTitle.textContent = alg;
                algTitle.style.fontSize = '13px';
                algTitle.style.fontWeight = '500';
                algTitle.style.marginBottom = '5px';
                
                algContainer.appendChild(algTitle);
                
                // Sort by environment order: prod, stage, dev
                items.sort((a, b) => {
                  const order = { 'prod': 0, 'stage': 1, 'dev': 2 };
                  return order[a.env] - order[b.env];
                }).forEach(item => {
                  const itemContainer = document.createElement('div');
                  itemContainer.style.display = 'flex';
                  itemContainer.style.alignItems = 'center';
                  itemContainer.style.marginBottom = '8px';
                  
                  const envLabel = document.createElement('div');
                  envLabel.textContent = item.env;
                  envLabel.style.width = '50px';
                  envLabel.style.fontSize = '12px';
                  envLabel.style.opacity = '0.8';
                  
                  const progressContainer = document.createElement('div');
                  progressContainer.className = 'progress-container';
                  progressContainer.style.height = '12px';
                  progressContainer.style.margin = '0 10px 0 0';
                  
                  const progressBar = document.createElement('div');
                  progressBar.className = 'progress-bar';
                  progressBar.style.width = \`\${item.pct_done}%\`;
                  progressBar.style.backgroundColor = envColors[item.env];
                  
                  const percentText = document.createElement('div');
                  percentText.textContent = \`\${item.pct_done}%\`;
                  percentText.style.width = '35px';
                  percentText.style.fontSize = '12px';
                  percentText.style.textAlign = 'right';
                  
                  progressContainer.appendChild(progressBar);
                  itemContainer.appendChild(envLabel);
                  itemContainer.appendChild(progressContainer);
                  itemContainer.appendChild(percentText);
                  
                  algContainer.appendChild(itemContainer);
                });
                
                pqcProgress.appendChild(algContainer);
              });
            }
            
            // Initially fetch sample data to populate the dashboard
            fetch('/api/data')
              .then(response => response.json())
              .then(data => {
                // Update all panels with the initial data
                updateTTBChart(data.ttb_metrics);
                updateRiskMatrix(data.risk_matrix);
                updateVulnerableSystems(data.vulnerable_systems);
                updateQuantumOrchestra(data.quantum_orchestra);
                updateShorWorkflow(data.shor_workflow);
                updateGroverGauge(data.grover_metrics);
                updateFidelityGauge(data.fidelity);
                updateTestStatus(data.job_status);
                updateComplianceAndPQC(data.compliance);
                
                lastUpdate = new Date();
                document.getElementById('last-updated').textContent = lastUpdate.toLocaleTimeString();
              })
              .catch(error => {
                console.error('Error fetching initial data:', error);
              });
          </script>
        </body>
      </html>
    `);
    return;
  }
  
  // Serve static files
  let filePath = path.join(__dirname, req.url);
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║ QStrike Enhanced Dashboard Server running on port ${PORT}           ║
║ Open http://localhost:${PORT} in your browser to view the dashboard ║
╚════════════════════════════════════════════════════════════════╝
  `);
});