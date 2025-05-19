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
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'qstrike-enhanced-schema.json');

// Configuration
const SERVER_CONFIG = {
  sseUpdateInterval: 2000,  // Update interval in milliseconds
  defaultPanelUpdateRate: 2000, // Default panel refresh rate
  enableSSE: true,  // Enable Server-Sent Events
  enableCompression: false  // Compression for production (would require additional modules)
};

// Ensure data file exists
let qstrikeData;
try {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Error: Data file ${DATA_FILE} not found`);
    process.exit(1);
  }
  
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  qstrikeData = JSON.parse(data);
  console.log(`Loaded QStrike data from ${DATA_FILE}`);
} catch (error) {
  console.error(`Error loading QStrike data: ${error.message}`);
  process.exit(1);
}

// Simulated data update function
function simulateDataChanges(data) {
  const updatedData = JSON.parse(JSON.stringify(data));
  
  // QryAI Provider metrics variations
  if (updatedData.qryai_orchestrator && updatedData.qryai_orchestrator.providers) {
    updatedData.qryai_orchestrator.providers.forEach(provider => {
      // Small variations in metrics
      provider.metrics.gate_err_2q *= (1 + (Math.random() * 0.05 - 0.025));
      provider.metrics.t1_time_us *= (1 + (Math.random() * 0.03 - 0.015));
      provider.metrics.t2_time_us *= (1 + (Math.random() * 0.03 - 0.015));
      provider.metrics.queue_depth = Math.max(0, provider.metrics.queue_depth + 
        (Math.random() > 0.7 ? Math.floor(Math.random() * 3) - 1 : 0));
      
      // Occasionally vary calibration drift
      if (Math.random() > 0.8) {
        provider.calibration.drift_percentage *= (1 + (Math.random() * 0.1 - 0.05));
      }
    });
  }
  
  // Update cryptanalytic workloads progress
  if (updatedData.cryptanalytic_workloads && updatedData.cryptanalytic_workloads.workload_groups) {
    updatedData.cryptanalytic_workloads.elapsed_time_sec += SERVER_CONFIG.sseUpdateInterval / 1000;
    
    updatedData.cryptanalytic_workloads.workload_groups.forEach(group => {
      // Only update in-progress workloads
      if (group.progress < 1.0) {
        // Update active shards
        group.shards.forEach(shard => {
          if (shard.status === 'running') {
            // Progress increments
            const progressIncrement = Math.random() * 0.005; // 0.0-0.5% progress per update
            shard.progress = Math.min(1.0, shard.progress + progressIncrement);
            
            // Update round completions
            if (shard.phase_estimation_rounds_completed) {
              const newRounds = Math.floor(progressIncrement * shard.phase_estimation_rounds_total);
              shard.phase_estimation_rounds_completed = Math.min(
                shard.phase_estimation_rounds_total,
                shard.phase_estimation_rounds_completed + newRounds
              );
            } else if (shard.grover_iterations_completed) {
              const newIterations = Math.floor(progressIncrement * shard.grover_iterations_total);
              shard.grover_iterations_completed = Math.min(
                shard.grover_iterations_total,
                shard.grover_iterations_completed + newIterations
              );
            }
            
            // Update ETA
            if (shard.progress > 0) {
              shard.eta_sec = Math.max(0, Math.floor(
                ((1.0 - shard.progress) / shard.progress) * 
                (updatedData.cryptanalytic_workloads.elapsed_time_sec * shard.progress)
              ));
            }
            
            // Update costs
            if (shard.cost_usd_current) {
              const costPerSec = shard.cost_usd_current / (updatedData.cryptanalytic_workloads.elapsed_time_sec * shard.progress);
              shard.cost_usd_current += costPerSec * (SERVER_CONFIG.sseUpdateInterval / 1000);
            }
            
            // Occasionally complete a shard if it's over 98% done
            if (shard.progress > 0.98 && Math.random() > 0.7) {
              shard.status = 'completed';
              shard.progress = 1.0;
              if (shard.phase_estimation_rounds_completed) {
                shard.phase_estimation_rounds_completed = shard.phase_estimation_rounds_total;
              } else if (shard.grover_iterations_completed) {
                shard.grover_iterations_completed = shard.grover_iterations_total;
              }
              shard.eta_sec = 0;
              shard.result_hash = generateRandomHash();
              shard.cross_validated = true;
              
              // Move cost from current to final
              shard.cost_usd = shard.cost_usd_current;
              delete shard.cost_usd_current;
              
              // Update completed shard count
              group.completed_shards++;
              group.active_shards--;
            }
          }
        });
        
        // Recalculate overall group progress based on shards
        const totalProgress = group.shards.reduce((sum, shard) => sum + shard.progress, 0);
        group.progress = totalProgress / group.shards.length;
        
        // Update ETA for the group
        const avgRemainingTime = group.shards
          .filter(shard => shard.status === 'running')
          .map(shard => shard.eta_sec)
          .reduce((sum, eta) => sum + eta, 0) / group.active_shards;
        
        group.eta_sec = Math.max(0, Math.floor(avgRemainingTime));
        
        // Update success probability with small random variations
        group.success_probability *= (1 + (Math.random() * 0.01 - 0.005));
        group.success_probability = Math.max(0, Math.min(1, group.success_probability));
        
        // Update confidence intervals
        const ciSpread = group.success_probability * 0.1;
        group.confidence_interval = [
          Math.max(0, group.success_probability - ciSpread),
          Math.min(1, group.success_probability + ciSpread)
        ];
      }
    });
    
    // Recalculate overall progress
    const totalGroupProgress = updatedData.cryptanalytic_workloads.workload_groups
      .reduce((sum, group) => sum + group.progress, 0);
    updatedData.cryptanalytic_workloads.overall_progress = 
      totalGroupProgress / updatedData.cryptanalytic_workloads.workload_groups.length;
  }
  
  // Update cross-validation data
  if (updatedData.cross_validation && updatedData.cross_validation.validation_matrices) {
    updatedData.cross_validation.last_updated = new Date().toISOString();
    
    // Small variations in p-values and confidence overlaps
    updatedData.cross_validation.validation_matrices.forEach(matrix => {
      if (matrix.matrix) {
        matrix.matrix.forEach(validation => {
          validation.chi_square_p_value *= (1 + (Math.random() * 0.02 - 0.01));
          validation.chi_square_p_value = Math.min(0.05, Math.max(0.01, validation.chi_square_p_value));
          
          validation.confidence_overlap_pct *= (1 + (Math.random() * 0.01 - 0.005));
          validation.confidence_overlap_pct = Math.min(100, Math.max(95, validation.confidence_overlap_pct));
        });
      }
      
      // Occasionally add a fault event
      if (Math.random() > 0.95 && (!matrix.fault_events || matrix.fault_events.length === 0)) {
        const providers = updatedData.qryai_orchestrator.providers.map(p => p.id);
        if (!matrix.fault_events) matrix.fault_events = [];
        
        matrix.fault_events.push({
          timestamp: new Date().toISOString(),
          primary_provider: providers[Math.floor(Math.random() * providers.length)],
          secondary_provider: providers[Math.floor(Math.random() * providers.length)],
          chi_square_p_value: 0.01 + Math.random() * 0.01,
          confidence_overlap_pct: 80 + Math.random() * 10,
          status: "fail",
          resolution: "tertiary_validation_requested",
          tertiary_provider: providers[Math.floor(Math.random() * providers.length)],
          tertiary_chi_square_p_value: 0.03 + Math.random() * 0.02,
          tertiary_confidence_overlap_pct: 95 + Math.random() * 5,
          final_status: "resolved_with_tertiary"
        });
      }
    });
  }
  
  // Update error correction data
  if (updatedData.error_correction && updatedData.error_correction.schemes) {
    updatedData.error_correction.schemes.forEach(scheme => {
      // Small variations in error rates
      scheme.logical_error_rate_range[0] *= (1 + (Math.random() * 0.02 - 0.01));
      scheme.logical_error_rate_range[1] *= (1 + (Math.random() * 0.02 - 0.01));
    });
    
    // Update ZNE data
    if (updatedData.error_correction.zero_noise_extrapolation &&
        updatedData.error_correction.zero_noise_extrapolation.enabled) {
      // Sometimes toggle ZNE providers
      if (Math.random() > 0.9) {
        const providers = updatedData.qryai_orchestrator.providers.map(p => p.id);
        const providerCount = Math.ceil(Math.random() * providers.length);
        updatedData.error_correction.zero_noise_extrapolation.providers_using_zne = 
          providers.slice(0, providerCount);
      }
    }
  }
  
  // Update HPC merger resource utilization
  if (updatedData.hpc_merger && updatedData.hpc_merger.resources) {
    const utilization = updatedData.hpc_merger.resources.utilization;
    utilization.cpu_pct = Math.min(100, Math.max(50, utilization.cpu_pct + (Math.random() * 10 - 5)));
    utilization.ram_pct = Math.min(100, Math.max(60, utilization.ram_pct + (Math.random() * 10 - 5)));
    utilization.gpu_pct = Math.min(100, Math.max(70, utilization.gpu_pct + (Math.random() * 10 - 5)));
    utilization.network_egress_gbps = Math.max(1, utilization.network_egress_gbps * (1 + (Math.random() * 0.2 - 0.1)));
    
    // Update ZNE jobs
    if (updatedData.hpc_merger.zero_noise_extrapolation && 
        updatedData.hpc_merger.zero_noise_extrapolation.jobs) {
      updatedData.hpc_merger.zero_noise_extrapolation.jobs.forEach(job => {
        if (job.status === 'active') {
          // Small variations in success probabilities
          job.noise_scaling_points.forEach(point => {
            point.success_prob *= (1 + (Math.random() * 0.01 - 0.005));
            point.success_prob = Math.min(1, Math.max(0, point.success_prob));
          });
          
          job.extrapolated_zero_noise_prob *= (1 + (Math.random() * 0.01 - 0.005));
          job.extrapolated_zero_noise_prob = Math.min(1, Math.max(0, job.extrapolated_zero_noise_prob));
          
          job.residual_error *= (1 + (Math.random() * 0.05 - 0.025));
          job.residual_error = Math.min(0.1, Math.max(0.01, job.residual_error));
        }
      });
    }
  }
  
  // Update cryptanalytic results
  if (updatedData.cryptanalytic_results && updatedData.cryptanalytic_results.time_to_break) {
    // Update in-progress TTB estimates
    Object.entries(updatedData.cryptanalytic_results.time_to_break).forEach(([key, value]) => {
      if (value.status === 'in_progress') {
        value.elapsed_time_h += SERVER_CONFIG.sseUpdateInterval / 3600000;
        value.remaining_time_h = Math.max(0, value.estimated_total_time_h - value.elapsed_time_h);
        
        // Small variations in success probability
        value.success_probability *= (1 + (Math.random() * 0.01 - 0.005));
        value.success_probability = Math.min(1, Math.max(0, value.success_probability));
        
        // Update confidence intervals
        const ciSpread = value.success_probability * 0.1;
        value.confidence_interval = [
          Math.max(0, value.success_probability - ciSpread),
          Math.min(1, value.success_probability + ciSpread)
        ];
        
        // Occasionally complete a job
        if (value.remaining_time_h < 0.1 && Math.random() > 0.7) {
          value.status = 'completed';
          value.total_time_h = value.elapsed_time_h;
          delete value.remaining_time_h;
          delete value.estimated_total_time_h;
          
          if (key.includes('rsa') || key.includes('ecc')) {
            value.key_recovered = true;
          } else if (key.includes('md5')) {
            value.collision_found = true;
          } else if (key.includes('aes')) {
            value.key_recovered = true;
          }
          
          value.verification_status = 'validated';
        }
      }
    });
  }
  
  // Update security controls
  if (updatedData.security_controls) {
    // Update JWT expiry times
    if (updatedData.security_controls.jwt_tokens) {
      updatedData.security_controls.jwt_tokens.forEach(token => {
        // If token is expiring soon, renew it
        const expiryTime = new Date(token.expiry_time);
        const now = new Date();
        if (expiryTime.getTime() - now.getTime() < 5 * 60 * 1000) { // less than 5 minutes
          const newExpiry = new Date(now);
          newExpiry.setMinutes(newExpiry.getMinutes() + 15);
          token.expiry_time = newExpiry.toISOString();
        }
      });
    }
    
    // Update provenance bundle
    if (updatedData.security_controls.provenance_bundle) {
      const now = new Date();
      const lastSigned = new Date(updatedData.security_controls.provenance_bundle.last_signed_timestamp);
      if (now.getTime() - lastSigned.getTime() > updatedData.security_controls.provenance_bundle.sign_interval_sec * 1000) {
        updatedData.security_controls.provenance_bundle.last_signed_timestamp = now.toISOString();
      }
    }
  }
  
  // Update budget and cost info
  if (updatedData.budget_and_cost) {
    // Increase current spend
    const spendRate = updatedData.budget_and_cost.projected_total_usd / 
      (24 * 60 * 60 * 1000) * SERVER_CONFIG.sseUpdateInterval;
    
    updatedData.budget_and_cost.current_spend_usd += spendRate;
    
    // Update provider costs
    if (updatedData.budget_and_cost.provider_costs) {
      updatedData.budget_and_cost.provider_costs.forEach(provider => {
        const providerSpendRate = (provider.projected_usd / 
          (24 * 60 * 60 * 1000)) * SERVER_CONFIG.sseUpdateInterval;
        
        provider.current_usd += providerSpendRate;
      });
    }
    
    // Update HPC costs
    if (updatedData.budget_and_cost.hpc_costs) {
      const hpcSpendRate = (updatedData.budget_and_cost.hpc_costs.projected_usd / 
        (24 * 60 * 60 * 1000)) * SERVER_CONFIG.sseUpdateInterval;
      
      updatedData.budget_and_cost.hpc_costs.current_usd += hpcSpendRate;
    }
    
    // Check budget status
    if (updatedData.budget_and_cost.current_spend_usd > updatedData.budget_and_cost.total_budget_usd * 0.8) {
      updatedData.budget_and_cost.budget_status = 'warning';
    }
    if (updatedData.budget_and_cost.current_spend_usd > updatedData.budget_and_cost.total_budget_usd) {
      updatedData.budget_and_cost.budget_status = 'exceeded';
    }
  }
  
  // Update timestamps
  updatedData.timestamp = new Date().toISOString();
  
  return updatedData;
}

// Utility function to generate a random hash
function generateRandomHash() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log each request
  console.log(`Request received for: ${req.url}`);
  
  // Handle CORS (in a production environment, this would be more restrictive)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle SSE endpoint for real-time data simulation
  if (req.url === '/api/stream') {
    if (!SERVER_CONFIG.enableSSE) {
      res.writeHead(404);
      res.end('SSE endpoint is disabled');
      return;
    }
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Function to send an event with real-time data changes
    const sendEvent = () => {
      // Update the data with simulated changes
      qstrikeData = simulateDataChanges(qstrikeData);
      
      // Send the event
      res.write(`data: ${JSON.stringify(qstrikeData)}\n\n`);
    };
    
    // Send initial data
    sendEvent();
    
    // Send periodic updates
    const intervalId = setInterval(sendEvent, SERVER_CONFIG.sseUpdateInterval);
    
    // Clean up on close
    req.on('close', () => {
      clearInterval(intervalId);
      console.log('SSE connection closed');
    });
    
    return;
  }
  
  // Serve the API data as a static file
  if (req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(qstrikeData));
    return;
  }
  
  // Serve dashboard HTML
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    const htmlPath = path.join(__dirname, 'qstrike-production-dashboard.html');
    
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.end(html);
    } catch (error) {
      // If HTML file doesn't exist, serve embedded HTML
      serveEmbeddedDashboard(res);
    }
    return;
  }
  
  // Get any static assets
  const fileExtension = path.extname(req.url);
  if (fileExtension && mimeTypes[fileExtension]) {
    const filePath = path.join(__dirname, req.url);
    
    // Try to serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end(`File not found: ${req.url}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': mimeTypes[fileExtension] });
      res.end(content);
    });
    return;
  }
  
  // If nothing else matched, return 404
  res.writeHead(404);
  res.end('Not Found');
});

// Function to serve embedded dashboard when HTML file is not available
function serveEmbeddedDashboard(res) {
  // This is a placeholder that would be replaced with actual embedded HTML
  // In a real implementation, this would contain the full HTML for the dashboard
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QStrike™ Production Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #121936;
            color: white;
            text-align: center;
            padding: 50px;
          }
          h1 {
            color: #00a2ff;
          }
          p {
            margin-bottom: 20px;
          }
          .button {
            background-color: #00a2ff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>QStrike™ Production Dashboard</h1>
        <p>Dashboard HTML file not found. Please create qstrike-production-dashboard.html.</p>
        <button class="button" onclick="window.location.href='/api/data'">View Raw Data</button>
      </body>
    </html>
  `);
}

// Start the server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║ QStrike™ Production Dashboard running on port ${PORT}            ║
║ Open http://localhost:${PORT} in your browser to view the dashboard ║
╚════════════════════════════════════════════════════════════════╝
  `);
});