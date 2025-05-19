# QStrike Investor Demo Guide

This guide outlines a 10-minute demo flow for presenting QStrike to investors and clients, highlighting the cinematic qualities and technical capabilities of the dashboard.

## Demo Flow (10 minutes)

### 1. Open QStrike Dashboard (30 seconds)
```bash
# Open in browser
open https://demo.qstrike.com
```
- Note the animated logo intro
- Point out the cyberpunk cityscape parallax background
- The ambient synth soundtrack creates atmosphere (can be muted if preferred)

### 2. Run Live Demo (2 minutes)
- Click the **Run Live Demo** button (notice the pulsing glow effect)
- Immediately point out:
  - The neon color palette (magenta for Shor, cyan for Grover)
  - The animated Shor Pipeline bars growing in real-time
  - The Grover Spiral tightening as iterations progress
  - The Quantum Globe with laser arcs between providers

### 3. Switch to Live Job (2 minutes)
```bash
# Use this job ID when prompted
client123-jobabc
```
- Copy-paste the job ID into the input field and click "Connect"
- When connected, note that:
  - The pipeline and spiral reset and begin new animations
  - The ETA dial counts down based on real-time metrics
  - Provider cards update with live statistics

### 4. Trigger Gate-Error Drift (3 minutes)
```bash
# Run from terminal
cd QStrike
./scripts/sim-drift.sh
```
- Watch as:
  - The globe arcs reroute (QryAI detecting the drift)
  - The Sankey diagram shows flow redirection
  - Success Probability decreases and ETA increases
  - The Telegram alert appears on phone (if configured)

### 5. Show ETA Thermometer (1 minute)
- Hover over the Success Thermometer:
  - Note the violet bar showing "2028 power" runtime projection
  - Explain this is based on the real scaling formula in `scale.ts`
  - Point out that this visualizes the quantum advantage timeline

### 6. Download CSV Data (1 minute)
- Click the "Download CSV" button
- Open the downloaded file to show:
  - Every visualization is backed by raw data
  - Complete event history is available for analysis
  - All metrics are time-series based with accurate timestamps

### 7. Fullscreen Finale (1 minute)
- End with the quantum globe in fullscreen:
  - Perfect backdrop for Q&A
  - Visually reinforces the global quantum computing ecosystem

## Technical Highlights

During the demo, be prepared to highlight these technical achievements if asked:

1. **Binary WebSocket Protocol**
   - DevTools shows raw binary frames (no JSON)
   - ACK-based flow control prevents memory issues
   - JWT subject claim verification for tenant isolation

2. **Dashboard Performance**
   - 50k EPS (events per second) without frame drops
   - Vite build with manual chunks (<500 kB each)
   - Fast initial page load even on conference Wi-Fi

3. **Production Readiness**
   - Helm chart with values-prod.yaml
   - All container images pinned to specific versions
   - Monitoring with Prometheus/Grafana integration

## Troubleshooting

If any issues arise during the demo:

1. **If WebSocket connection fails:**
   - Automatically falls back to mock mode after 5 seconds
   - Click "Disconnect / Reset" and then "Run Live Demo" again

2. **If animations seem sluggish:**
   - Reduce browser window size slightly
   - Ensure no other resource-intensive applications are running

3. **If alert notification doesn't appear:**
   - Manually point out the gate error change in the provider card
   - Show how the success probability decreased with the error increase