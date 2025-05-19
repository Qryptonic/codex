#!/bin/bash

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}QStrike Dashboard Demo (Full Version)${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo

# Start the WebSocket server
echo -e "${BLUE}Starting WebSocket server on port 8080...${NC}"
node /Users/jason/Documents/QS/ws-server.js &
WS_SERVER_PID=$!

# Sleep to make sure the WebSocket server is up
sleep 2

# Navigate to UI directory
cd /Users/jason/Documents/QS/QStrike/ui.bak.black

# Start the UI server
echo -e "${GREEN}Starting UI server on port 3000...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo -e "${BLUE}Open http://localhost:3000 in your browser${NC}"

# Serve the UI on port 3000 
npx vite preview --host --port 3000

# Cleanup function
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $WS_SERVER_PID
  echo -e "${GREEN}All servers stopped${NC}"
  exit 0
}

# Trap Ctrl+C to clean up properly
trap cleanup INT TERM

# Wait for UI server to exit
wait