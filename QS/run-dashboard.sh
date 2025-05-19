#!/bin/bash

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}QStrike Dashboard Demo${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo

# Start a simple test WebSocket server
echo -e "${BLUE}Starting test server on port 8080...${NC}"
node /Users/jason/Documents/QS/test-server.js &
TEST_SERVER_PID=$!

# Navigate to UI directory and serve the UI
cd /Users/jason/Documents/QS/QStrike/ui.bak.black
echo -e "${GREEN}Starting UI server on port 3000...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo -e "${BLUE}Open http://localhost:3000 in your browser${NC}"

# Serve the UI on port 3000
npx vite preview --host --port 3000

# Cleanup on exit
kill $TEST_SERVER_PID
echo -e "${GREEN}All servers stopped${NC}"