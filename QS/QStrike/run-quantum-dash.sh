#!/bin/bash

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}QStrike Quantum Orchestra Dashboard${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo

# Navigate to UI directory and start the development server
cd /Users/jason/Documents/QS/QStrike/ui
echo -e "${BLUE}Starting UI development server...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo

# Try to start on port 3000, but Vite will automatically find an available port if 3000 is in use
npx vite --port 3000
