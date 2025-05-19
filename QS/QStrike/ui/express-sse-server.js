#!/usr/bin/env node

/**
 * QStrike SSE Server
 * 
 * This Express server provides a Server-Sent Events (SSE) endpoint
 * that simulates streaming data for the QStrike dashboard.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 9001;

// Enable CORS for all routes
app.use(cors());

// Load static simulation data
const simulationData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'static-simulation-data.json'), 'utf8'));

// SSE endpoint
app.get('/api/stream', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Helper to send SSE data
  const sendEvent = (event, data) => {
    res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
  };
  
  // Send initial data burst
  const { ttb_series, risk_matrix, top_vulnerabilities, shor_status, grover_stats, fidelity, job_status_summary, compliance_status, pqc_deployments } = simulationData;
  
  // Time-to-Break initial data
  sendEvent('ttb_update', {
    timestamp: new Date().toISOString(),
    alg: 'RSA2048',
    ttb_sec: ttb_series[0].RSA2048
  });
  
  sendEvent('ttb_update', {
    timestamp: new Date().toISOString(),
    alg: 'ECCP256',
    ttb_sec: ttb_series[0].ECCP256
  });
  
  sendEvent('ttb_update', {
    timestamp: new Date().toISOString(),
    alg: 'AES128',
    ttb_sec: ttb_series[0].AES128
  });
  
  sendEvent('ttb_update', {
    timestamp: new Date().toISOString(),
    alg: 'MD5',
    ttb_sec: ttb_series[0].MD5
  });
  
  // Orchestra Power
  sendEvent('orchestra_power', {
    timestamp: new Date().toISOString(),
    aggregate_power: simulationData.orchestra_history[0].aggregate_power
  });
  
  // Backend metrics for each provider
  simulationData.orchestra_history[0].backend_metrics.forEach(metric => {
    sendEvent('backend_metric', {
      timestamp: new Date().toISOString(),
      ...metric
    });
  });
  
  // Risk matrix entries
  risk_matrix.forEach(risk => {
    sendEvent('risk_update', {
      timestamp: new Date().toISOString(),
      ...risk
    });
  });
  
  // Top vulnerabilities
  sendEvent('vuln_update', {
    timestamp: new Date().toISOString(),
    top: top_vulnerabilities
  });
  
  // Shor status
  sendEvent('shor_progress', {
    timestamp: new Date().toISOString(),
    stages: shor_status.stages,
    eta_sec: shor_status.eta_sec
  });
  
  // Grover stats
  sendEvent('grover_stats', {
    timestamp: new Date().toISOString(),
    calls_per_sec: grover_stats.calls_per_sec,
    error_rate: grover_stats.error_rate
  });
  
  // Fidelity
  sendEvent('fidelity_update', {
    timestamp: new Date().toISOString(),
    avg_fidelity: fidelity.fidelity
  });
  
  // Job status
  sendEvent('job_status', {
    timestamp: new Date().toISOString(),
    ...job_status_summary
  });
  
  // Compliance status for each framework
  compliance_status.forEach(compliance => {
    sendEvent('compliance_update', {
      timestamp: new Date().toISOString(),
      ...compliance
    });
  });
  
  // PQC deployments for each algorithm and environment
  pqc_deployments.forEach(pqc => {
    sendEvent('pqc_update', {
      timestamp: new Date().toISOString(),
      ...pqc
    });
  });
  
  // Simulation hour index for ttb time series
  let hourIdx = 0;
  
  // Set up interval for continuous updates
  const intervalId = setInterval(() => {
    // Advance simulation hour
    hourIdx = (hourIdx + 1) % 24;
    
    // Update TTB values from time series
    sendEvent('ttb_update', {
      timestamp: ttb_series[hourIdx].timestamp,
      alg: 'RSA2048',
      ttb_sec: ttb_series[hourIdx].RSA2048
    });
    
    sendEvent('ttb_update', {
      timestamp: ttb_series[hourIdx].timestamp,
      alg: 'ECCP256',
      ttb_sec: ttb_series[hourIdx].ECCP256
    });
    
    sendEvent('ttb_update', {
      timestamp: ttb_series[hourIdx].timestamp,
      alg: 'AES128',
      ttb_sec: ttb_series[hourIdx].AES128
    });
    
    sendEvent('ttb_update', {
      timestamp: ttb_series[hourIdx].timestamp,
      alg: 'MD5',
      ttb_sec: ttb_series[hourIdx].MD5
    });
    
    // Generate random fluctuations for other metrics
    const randomAssetIdx = Math.floor(Math.random() * risk_matrix.length);
    const randomVulnIdx = Math.floor(Math.random() * top_vulnerabilities.length);
    
    // Update a random risk cell with a small risk level change
    if (Math.random() > 0.7) {
      const levels = ['Low', 'Medium', 'High'];
      const currentLevelIdx = levels.indexOf(risk_matrix[randomAssetIdx].level);
      let newLevelIdx = currentLevelIdx;
      
      // Slightly adjust the level randomly, but avoid dramatic changes
      if (Math.random() > 0.5 && currentLevelIdx < levels.length - 1) {
        newLevelIdx = currentLevelIdx + 1;
      } else if (Math.random() <= 0.5 && currentLevelIdx > 0) {
        newLevelIdx = currentLevelIdx - 1;
      }
      
      const updatedRisk = {
        ...risk_matrix[randomAssetIdx],
        level: levels[newLevelIdx]
      };
      
      sendEvent('risk_update', {
        timestamp: new Date().toISOString(),
        ...updatedRisk
      });
    }
    
    // Update a random vulnerability with a small risk score change
    if (Math.random() > 0.7) {
      const currentScore = top_vulnerabilities[randomVulnIdx].risk_score;
      const scoreChange = (Math.random() * 0.04) - 0.02; // -0.02 to 0.02
      let newScore = currentScore + scoreChange;
      
      // Clamp to valid range
      newScore = Math.max(0, Math.min(1, newScore));
      
      // Update priorities based on score
      let priority = 'Low';
      if (newScore > 0.8) priority = 'Urgent';
      else if (newScore > 0.6) priority = 'High';
      else if (newScore > 0.3) priority = 'Medium';
      
      const updatedVuln = {
        ...top_vulnerabilities[randomVulnIdx],
        risk_score: parseFloat(newScore.toFixed(2)),
        priority
      };
      
      // Create updated array
      const updatedVulns = [...top_vulnerabilities];
      updatedVulns[randomVulnIdx] = updatedVuln;
      
      // Sort by risk score descending
      updatedVulns.sort((a, b) => b.risk_score - a.risk_score);
      
      sendEvent('vuln_update', {
        timestamp: new Date().toISOString(),
        top: updatedVulns
      });
    }
    
    // Update Shor's algorithm progress
    const shorProgress = [...shor_status.stages];
    shorProgress[0].pct_complete = Math.min(1, shorProgress[0].pct_complete + 0.03);
    
    if (shorProgress[0].pct_complete >= 1) {
      shorProgress[1].pct_complete = Math.min(1, shorProgress[1].pct_complete + 0.02);
      
      if (shorProgress[1].pct_complete >= 1) {
        shorProgress[2].pct_complete = Math.min(1, shorProgress[2].pct_complete + 0.01);
      }
    }
    
    // Update ETA based on progress
    const totalProgress = shorProgress.reduce((sum, stage) => sum + stage.pct_complete, 0) / 3;
    const newEta = Math.max(0, Math.round(shor_status.eta_sec * (1 - totalProgress)));
    
    sendEvent('shor_progress', {
      timestamp: new Date().toISOString(),
      stages: shorProgress,
      eta_sec: newEta
    });
    
    // Update Grover stats with small fluctuations
    const callsChange = Math.round((Math.random() * 100000) - 50000); // -50K to +50K
    const errChange = (Math.random() * 0.0004) - 0.0002; // -0.0002 to +0.0002
    
    sendEvent('grover_stats', {
      timestamp: new Date().toISOString(),
      calls_per_sec: Math.max(0, grover_stats.calls_per_sec + callsChange),
      error_rate: Math.max(0.0001, Math.min(0.01, grover_stats.error_rate + errChange))
    });
    
    // Update fidelity with small fluctuations
    const fidelityChange = (Math.random() * 0.002) - 0.001; // -0.001 to +0.001
    sendEvent('fidelity_update', {
      timestamp: new Date().toISOString(),
      avg_fidelity: Math.max(0.9, Math.min(0.999, fidelity.fidelity + fidelityChange))
    });
    
    // Update job stats with small fluctuations
    const runningChange = Math.random() > 0.5 ? 1 : -1;
    const queuedChange = Math.random() > 0.5 ? 1 : -1;
    const failedChange = Math.random() > 0.8 ? 1 : 0;
    const slaChange = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
    
    sendEvent('job_status', {
      timestamp: new Date().toISOString(),
      running: Math.max(0, job_status_summary.running + runningChange),
      queued: Math.max(0, job_status_summary.queued + queuedChange),
      failed: Math.max(0, job_status_summary.failed + failedChange),
      sla_pct: Math.min(100, Math.max(95, job_status_summary.sla_pct + slaChange))
    });
    
    // Occasionally update PQC deployment progress
    if (Math.random() > 0.8) {
      const randomPqcIdx = Math.floor(Math.random() * pqc_deployments.length);
      const progressChange = Math.random() > 0.3 ? 1 : 0;
      
      const updatedPqc = {
        ...pqc_deployments[randomPqcIdx],
        pct_done: Math.min(100, pqc_deployments[randomPqcIdx].pct_done + progressChange)
      };
      
      sendEvent('pqc_update', {
        timestamp: new Date().toISOString(),
        ...updatedPqc
      });
    }
    
    // Occasionally update a random compliance status
    if (Math.random() > 0.9) {
      const randomComplIdx = Math.floor(Math.random() * compliance_status.length);
      const statusChange = Math.random() > 0.7;
      
      const updatedCompliance = {
        ...compliance_status[randomComplIdx],
        status: statusChange ? 'pass' : 'fail'
      };
      
      sendEvent('compliance_update', {
        timestamp: new Date().toISOString(),
        ...updatedCompliance
      });
    }
    
    // Very occasionally update aggregate power with small fluctuations
    if (Math.random() > 0.7) {
      const powerChange = Math.round((Math.random() * 2000) - 1000); // -1000 to +1000
      
      sendEvent('orchestra_power', {
        timestamp: new Date().toISOString(),
        aggregate_power: Math.max(100000, simulationData.orchestra_history[0].aggregate_power + powerChange)
      });
    }
    
    // Very occasionally update a random provider metric
    if (Math.random() > 0.7) {
      const providers = simulationData.orchestra_history[0].backend_metrics;
      const randomProviderIdx = Math.floor(Math.random() * providers.length);
      const provider = providers[randomProviderIdx];
      
      const jobChange = Math.round((Math.random() * 10) - 5); // -5 to +5
      const errorChange = (Math.random() * 0.0002) - 0.0001; // Small error rate change
      
      sendEvent('backend_metric', {
        timestamp: new Date().toISOString(),
        provider: provider.provider,
        job_count: Math.max(0, provider.job_count + jobChange),
        avg_qubits: provider.avg_qubits,
        avg_error_rate: Math.max(0.0001, Math.min(0.01, provider.avg_error_rate + errorChange)),
        avg_latency_ms: provider.avg_latency_ms
      });
    }
  }, 3000); // Send events every 3 seconds
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected');
  });
});

// Simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'QStrike SSE server is running' });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Start the server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║    QStrike SSE Server running on port ${PORT}    ║
╠════════════════════════════════════════════════╣
║ Endpoints:                                     ║
║  - /api/stream  (SSE stream for dashboard)     ║
║  - /api/status  (Server status check)          ║
╚════════════════════════════════════════════════╝
  `);
});