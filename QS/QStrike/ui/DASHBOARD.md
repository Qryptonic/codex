# QStrike Enhanced Dashboard

This directory contains the enhanced QStrike dashboard with a Splunk-style 3×3 grid layout for visualizing quantum security metrics.

## Dashboard Features

The enhanced dashboard provides a comprehensive view of quantum security metrics with 9 specialized panels:

1. **Time-to-Break Trend** - Rolling 24h averages of TTB for RSA-2048, ECC P-256, AES-128
2. **Risk Heatmap** - Color-coded risk matrix showing risk levels per asset & crypto type
3. **Top 10 Vulnerable Systems** - Most at-risk assets ordered by risk score
4. **Quantum Orchestra Conductor** - Visualization of QryAI orchestrating quantum providers
5. **Shor's Algorithm Workflow** - Pipeline visualization showing progress of factoring operations
6. **Grover's Speedometer** - Gauge showing search speed and error rate for AES-128
7. **Simulation Fidelity Gauge** - Quality measurement of quantum simulation
8. **Active Test Status & SLA** - Job counts and SLA compliance metrics
9. **Compliance & PQC Migration** - Regulatory status and post-quantum cryptography rollout progress

## Quick Start

To run the dashboard with simulated data:

```bash
# Start the dashboard (includes both the UI server and SSE data server)
./start-dashboard.sh
```

This will:
1. Start the SSE server on port 9001 to provide simulated data streams
2. Start the Vite development server on port 9000
3. Open the dashboard in your default browser at http://localhost:9000

## Implementation Details

### Key Files

- `src/components/QStrikeEnhancedDashboard.tsx` - Main dashboard component with 3×3 grid layout
- `src/components/DashboardStyles.css` - Dashboard-specific styling
- `src/css/splunk-theme.css` - Splunk-inspired dark theme styling
- `express-sse-server.js` - Server-Sent Events server for real-time data simulation
- `src/static-simulation-data.json` - Static data for simulation
- `start-dashboard.sh` - Startup script for the complete dashboard experience

### Technology Stack

- **React** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **CSS Variables** - Consistent styling across components
- **ECharts** - Advanced data visualization library
- **Express** - Backend for the SSE server
- **Server-Sent Events (SSE)** - Real-time data streaming
- **Framer Motion** - Animations for UI elements

### Architecture

The dashboard follows a component-based architecture with:

1. **Data Layer** - SSE server providing real-time data streams
2. **Component Layer** - React components for each visualization panel
3. **Style Layer** - CSS variables and component-specific styling

## Troubleshooting

If you encounter any issues:

1. **Dashboard Not Starting**: Run `node dashboard-startup-check.cjs` to verify all files and configurations
2. **Data Not Updating**: Check that the SSE server is running (`curl http://localhost:9001/api/status`)
3. **Visualization Issues**: Check browser console for errors

## Development

To modify the dashboard:

1. Edit `src/components/QStrikeEnhancedDashboard.tsx` for layout and component changes
2. Edit `src/components/DashboardStyles.css` for styling changes
3. Edit `express-sse-server.js` to modify the simulation data patterns
4. Edit `src/static-simulation-data.json` to change the base simulation data