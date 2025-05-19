const http = require('http');
const fs = require('fs');
const path = require('path');

// Simulated dashboard data
function generateSimulatedData() {
  return {
    ttbTrend: [
      { date: '2025-01-01', value: Math.random() * 100 + 50 },
      { date: '2025-01-02', value: Math.random() * 100 + 50 },
      { date: '2025-01-03', value: Math.random() * 100 + 50 },
      { date: '2025-01-04', value: Math.random() * 100 + 50 },
      { date: '2025-01-05', value: Math.random() * 100 + 50 }
    ],
    riskMatrix: [
      { x: 0, y: 0, value: Math.random() * 100 },
      { x: 0, y: 1, value: Math.random() * 100 },
      { x: 0, y: 2, value: Math.random() * 100 },
      { x: 1, y: 0, value: Math.random() * 100 },
      { x: 1, y: 1, value: Math.random() * 100 },
      { x: 1, y: 2, value: Math.random() * 100 },
      { x: 2, y: 0, value: Math.random() * 100 },
      { x: 2, y: 1, value: Math.random() * 100 },
      { x: 2, y: 2, value: Math.random() * 100 }
    ],
    vulnerableSystems: [
      { name: 'Quantum Gateway', risk: Math.random() * 100 },
      { name: 'Shor Algorithm', risk: Math.random() * 100 },
      { name: 'Key Exchange', risk: Math.random() * 100 },
      { name: 'Encryption Layer', risk: Math.random() * 100 },
      { name: 'PQC Migration', risk: Math.random() * 100 }
    ],
    conductorStatus: Math.random() > 0.5,
    algorithmStages: [
      { stage: 'Initialization', complete: true },
      { stage: 'Quantum Register', complete: Math.random() > 0.3 },
      { stage: 'Processing', complete: Math.random() > 0.6 },
      { stage: 'Output', complete: Math.random() > 0.8 }
    ],
    speedometerValue: Math.random() * 100,
    fidelityGauge: Math.random() * 100,
    testStatus: {
      passing: Math.floor(Math.random() * 50),
      failing: Math.floor(Math.random() * 10),
      pending: Math.floor(Math.random() * 20)
    },
    complianceStatus: Math.random() * 100
  };
}

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
};

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log('Request received for:', req.url);
  
  // Handle SSE endpoint for real-time data
  if (req.url === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send data immediately on connection
    const data = generateSimulatedData();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    
    // Send periodic updates
    const intervalId = setInterval(() => {
      const data = generateSimulatedData();
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 2000);
    
    // Clean up on close
    req.on('close', () => {
      clearInterval(intervalId);
      console.log('SSE connection closed');
    });
    
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
          <title>QStrike Security Dashboard</title>
          <style>
            :root {
              /* Base Colors */
              --color-bg-darkest: #080a17;
              --color-bg-dark: #0f1325;
              --color-bg-card: #121936;
              --color-accent-primary: #00a2ff;
              --color-accent-secondary: #53ffa9;
              --color-text-primary: #ffffff;
              --color-text-secondary: #a0a7c4;
              --color-border: #1c2951;
              --color-error: #ff4757;
              --color-warning: #ffa502;
              --color-success: #2ed573;
              
              /* Shadows */
              --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.25);
              --shadow-hover: 0 8px 30px rgba(0, 162, 255, 0.2);
              
              /* Animation */
              --transition-quick: 0.15s ease;
              --transition-normal: 0.3s ease;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: var(--color-bg-darkest);
              color: var(--color-text-primary);
              line-height: 1.5;
            }
            
            .dashboard-container {
              max-width: 1440px;
              margin: 0 auto;
              padding: 20px;
            }
            
            header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
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
              margin-left: 10px;
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
            }
            
            .dashboard-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 300px);
              gap: 20px;
            }
            
            .card {
              background-color: var(--color-bg-card);
              border-radius: 8px;
              box-shadow: var(--shadow-card);
              padding: 16px;
              display: flex;
              flex-direction: column;
              transition: var(--transition-normal);
              position: relative;
              overflow: hidden;
              border: 1px solid var(--color-border);
            }
            
            .card:hover {
              box-shadow: var(--shadow-hover);
              transform: translateY(-2px);
              border-color: var(--color-accent-primary);
            }
            
            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .card-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--color-text-primary);
            }
            
            .card-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            
            .loading-indicator {
              display: inline-block;
              width: 50px;
              height: 50px;
              border: 3px solid rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              border-top-color: var(--color-accent-primary);
              animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            .heat-matrix {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 8px;
              width: 100%;
              height: 100%;
            }
            
            .heat-cell {
              border-radius: 4px;
              transition: var(--transition-quick);
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              font-size: 14px;
            }
            
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
            }
            
            .gauge-value {
              position: absolute;
              bottom: 10px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
            }
            
            .bar-chart {
              width: 100%;
              height: 200px;
              display: flex;
              align-items: flex-end;
              justify-content: space-around;
            }
            
            .bar {
              width: 30px;
              background: linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary));
              border-radius: 4px 4px 0 0;
              transition: var(--transition-normal);
            }
            
            .progress-container {
              width: 100%;
              height: 24px;
              background-color: var(--color-bg-dark);
              border-radius: 12px;
              overflow: hidden;
              margin: 8px 0;
            }
            
            .progress-bar {
              height: 100%;
              background: linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary));
              border-radius: 12px;
              transition: width var(--transition-normal);
            }
            
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
              border-radius: 4px;
              background-color: var(--color-bg-dark);
              transition: var(--transition-normal);
            }
            
            .stage.complete {
              background-color: rgba(46, 213, 115, 0.2);
              border-left: 4px solid var(--color-success);
            }
            
            .stage-indicator {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              margin-right: 12px;
              background-color: var(--color-bg-dark);
            }
            
            .stage.complete .stage-indicator {
              background-color: var(--color-success);
            }
            
            .vulnerable-systems {
              width: 100%;
            }
            
            .system-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid var(--color-border);
            }
            
            .system-item:last-child {
              border-bottom: none;
            }
            
            .risk-indicator {
              width: 50px;
              height: 8px;
              border-radius: 4px;
              background-color: var(--color-bg-dark);
              overflow: hidden;
            }
            
            .risk-level {
              height: 100%;
              transition: var(--transition-normal);
            }
            
            .status-indicator {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 24px;
              font-weight: bold;
              transition: var(--transition-normal);
            }
            
            .test-status {
              display: flex;
              justify-content: space-around;
              width: 100%;
            }
            
            .status-group {
              text-align: center;
            }
            
            .status-value {
              font-size: 24px;
              font-weight: bold;
            }
            
            .status-label {
              font-size: 14px;
              color: var(--color-text-secondary);
            }
            
            footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid var(--color-border);
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: var(--color-text-secondary);
            }
            
            @media (max-width: 1200px) {
              .dashboard-grid {
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(5, 300px);
              }
            }
            
            @media (max-width: 768px) {
              .dashboard-grid {
                grid-template-columns: 1fr;
                grid-template-rows: repeat(9, 300px);
              }
              
              header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
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
            
            <div class="dashboard-grid">
              <!-- Time-to-Break Trend -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Time-to-Break Trend</div>
                </div>
                <div class="card-content">
                  <div class="bar-chart" id="ttb-chart">
                    <!-- Bars will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Risk Heatmap -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Risk Heatmap</div>
                </div>
                <div class="card-content">
                  <div class="heat-matrix" id="risk-matrix">
                    <!-- Matrix cells will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Top Vulnerable Systems -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Top Vulnerable Systems</div>
                </div>
                <div class="card-content">
                  <div class="vulnerable-systems" id="vulnerable-systems">
                    <!-- System items will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Quantum Orchestra Conductor -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Quantum Orchestra Conductor</div>
                </div>
                <div class="card-content">
                  <div class="status-indicator" id="conductor-status">
                    <!-- Status will be updated dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Shor's Algorithm Workflow -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Shor's Algorithm Workflow</div>
                </div>
                <div class="card-content">
                  <div class="workflow-stages" id="algorithm-workflow">
                    <!-- Workflow stages will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Grover's Speedometer -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Grover's Speedometer</div>
                </div>
                <div class="card-content">
                  <div class="gauge-container" id="grover-gauge">
                    <div class="gauge-arc"></div>
                    <div class="gauge-value">0%</div>
                  </div>
                </div>
              </div>
              
              <!-- Simulation Fidelity Gauge -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Simulation Fidelity Gauge</div>
                </div>
                <div class="card-content">
                  <div class="gauge-container" id="fidelity-gauge">
                    <div class="gauge-arc"></div>
                    <div class="gauge-value">0%</div>
                  </div>
                </div>
              </div>
              
              <!-- Active Test Status & SLA -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Active Test Status & SLA</div>
                </div>
                <div class="card-content">
                  <div class="test-status" id="test-status">
                    <!-- Test status will be added dynamically -->
                  </div>
                </div>
              </div>
              
              <!-- Compliance & PQC Migration Progress -->
              <div class="card">
                <div class="card-header">
                  <div class="card-title">Compliance & PQC Migration</div>
                </div>
                <div class="card-content">
                  <div class="progress-container">
                    <div class="progress-bar" id="compliance-progress" style="width: 0%"></div>
                  </div>
                  <div id="compliance-percentage">0%</div>
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
            
            // Update the dashboard with the latest data
            eventSource.onmessage = function(event) {
              const data = JSON.parse(event.data);
              lastUpdate = new Date();
              document.getElementById('last-updated').textContent = lastUpdate.toLocaleTimeString();
              
              // Update Time-to-Break Trend
              updateTTBChart(data.ttbTrend);
              
              // Update Risk Heatmap
              updateRiskMatrix(data.riskMatrix);
              
              // Update Vulnerable Systems
              updateVulnerableSystems(data.vulnerableSystems);
              
              // Update Conductor Status
              updateConductorStatus(data.conductorStatus);
              
              // Update Algorithm Workflow
              updateAlgorithmWorkflow(data.algorithmStages);
              
              // Update Grover's Speedometer
              updateGroverGauge(data.speedometerValue);
              
              // Update Fidelity Gauge
              updateFidelityGauge(data.fidelityGauge);
              
              // Update Test Status
              updateTestStatus(data.testStatus);
              
              // Update Compliance Progress
              updateComplianceProgress(data.complianceStatus);
            };
            
            // Handle connection errors
            eventSource.onerror = function() {
              console.error('SSE connection error');
              document.getElementById('last-updated').textContent = 'Connection error';
            };
            
            // Function to update the Time-to-Break Trend chart
            function updateTTBChart(data) {
              const chartContainer = document.getElementById('ttb-chart');
              chartContainer.innerHTML = '';
              
              const maxValue = Math.max(...data.map(item => item.value));
              
              data.forEach(item => {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = \`\${(item.value / maxValue) * 100}%\`;
                bar.title = \`\${item.date}: \${Math.round(item.value)}\`;
                chartContainer.appendChild(bar);
              });
            }
            
            // Function to update the Risk Heatmap
            function updateRiskMatrix(data) {
              const matrixContainer = document.getElementById('risk-matrix');
              matrixContainer.innerHTML = '';
              
              for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                  const cell = document.createElement('div');
                  cell.className = 'heat-cell';
                  
                  const cellData = data.find(item => item.x === x && item.y === y);
                  if (cellData) {
                    const value = cellData.value;
                    const normalizedValue = value / 100;
                    
                    // Color gradient based on value
                    const r = Math.round(255 * normalizedValue);
                    const g = Math.round(255 * (1 - normalizedValue));
                    const b = 100;
                    
                    cell.style.backgroundColor = \`rgba(\${r}, \${g}, \${b}, 0.7)\`;
                    cell.textContent = Math.round(value);
                  }
                  
                  matrixContainer.appendChild(cell);
                }
              }
            }
            
            // Function to update the Vulnerable Systems list
            function updateVulnerableSystems(data) {
              const systemsContainer = document.getElementById('vulnerable-systems');
              systemsContainer.innerHTML = '';
              
              // Sort by risk (highest first)
              const sortedSystems = [...data].sort((a, b) => b.risk - a.risk);
              
              sortedSystems.forEach(system => {
                const systemItem = document.createElement('div');
                systemItem.className = 'system-item';
                
                const nameElement = document.createElement('div');
                nameElement.className = 'system-name';
                nameElement.textContent = system.name;
                
                const riskContainer = document.createElement('div');
                riskContainer.className = 'risk-indicator';
                
                const riskLevel = document.createElement('div');
                riskLevel.className = 'risk-level';
                riskLevel.style.width = \`\${system.risk}%\`;
                
                // Color based on risk level
                if (system.risk < 30) {
                  riskLevel.style.backgroundColor = 'var(--color-success)';
                } else if (system.risk < 70) {
                  riskLevel.style.backgroundColor = 'var(--color-warning)';
                } else {
                  riskLevel.style.backgroundColor = 'var(--color-error)';
                }
                
                riskContainer.appendChild(riskLevel);
                systemItem.appendChild(nameElement);
                systemItem.appendChild(riskContainer);
                systemsContainer.appendChild(systemItem);
              });
            }
            
            // Function to update the Conductor Status
            function updateConductorStatus(status) {
              const statusIndicator = document.getElementById('conductor-status');
              
              if (status) {
                statusIndicator.style.backgroundColor = 'rgba(46, 213, 115, 0.2)';
                statusIndicator.style.border = '2px solid var(--color-success)';
                statusIndicator.textContent = 'ACTIVE';
              } else {
                statusIndicator.style.backgroundColor = 'rgba(255, 71, 87, 0.2)';
                statusIndicator.style.border = '2px solid var(--color-error)';
                statusIndicator.textContent = 'INACTIVE';
              }
            }
            
            // Function to update Algorithm Workflow
            function updateAlgorithmWorkflow(stages) {
              const workflowContainer = document.getElementById('algorithm-workflow');
              workflowContainer.innerHTML = '';
              
              stages.forEach(stageData => {
                const stage = document.createElement('div');
                stage.className = 'stage' + (stageData.complete ? ' complete' : '');
                
                const indicator = document.createElement('div');
                indicator.className = 'stage-indicator';
                
                const name = document.createElement('div');
                name.className = 'stage-name';
                name.textContent = stageData.stage;
                
                stage.appendChild(indicator);
                stage.appendChild(name);
                workflowContainer.appendChild(stage);
              });
            }
            
            // Function to update Grover's Speedometer
            function updateGroverGauge(value) {
              const gaugeArc = document.getElementById('grover-gauge').querySelector('.gauge-arc');
              const gaugeValue = document.getElementById('grover-gauge').querySelector('.gauge-value');
              
              const percentage = value + '%';
              gaugeArc.style.setProperty('--percentage', percentage);
              gaugeValue.textContent = Math.round(value) + '%';
            }
            
            // Function to update Fidelity Gauge
            function updateFidelityGauge(value) {
              const gaugeArc = document.getElementById('fidelity-gauge').querySelector('.gauge-arc');
              const gaugeValue = document.getElementById('fidelity-gauge').querySelector('.gauge-value');
              
              const percentage = value + '%';
              gaugeArc.style.setProperty('--percentage', percentage);
              gaugeValue.textContent = Math.round(value) + '%';
            }
            
            // Function to update Test Status
            function updateTestStatus(status) {
              const statusContainer = document.getElementById('test-status');
              statusContainer.innerHTML = '';
              
              const groups = [
                { label: 'Passing', value: status.passing, color: 'var(--color-success)' },
                { label: 'Failing', value: status.failing, color: 'var(--color-error)' },
                { label: 'Pending', value: status.pending, color: 'var(--color-warning)' }
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
            }
            
            // Function to update Compliance Progress
            function updateComplianceProgress(value) {
              const progressBar = document.getElementById('compliance-progress');
              const percentageText = document.getElementById('compliance-percentage');
              
              progressBar.style.width = \`\${value}%\`;
              percentageText.textContent = \`\${Math.round(value)}% Complete\`;
            }
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