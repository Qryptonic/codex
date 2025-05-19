#!/bin/bash

# QStrike Dashboard Startup Script
# This script starts the QStrike dashboard for demonstration purposes

# Change to the ui directory
cd "$(dirname "$0")"

# Set port to 3000 for Vite, 3001 for SSE server
export PORT=3000
export SSE_PORT=3001

echo "Starting QStrike Enhanced Dashboard on port $PORT..."
echo "This is a demonstration version with simulated data."
echo "Starting SSE server on port $SSE_PORT..."

# Start SSE server in the background
node express-sse-server.cjs &
SSE_PID=$!

# Give the SSE server a moment to start
sleep 2

echo "Dashboard will be available at: http://localhost:$PORT"
echo "SSE server running at: http://localhost:$SSE_PORT/api/stream"

# Start the development server
npx vite --port $PORT

# Clean up when Vite exits
kill $SSE_PID