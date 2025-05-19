#!/bin/bash

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start the enhanced dashboard server on port 3000
echo "Starting QStrike dashboard on port 3000..."
echo "This is a standalone dashboard with simulated data."
echo "Open http://localhost:3000 in your browser to view it."

node enhanced-minimal-server.cjs