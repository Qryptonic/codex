#!/bin/bash
set -e

# Get the directory where the script resides
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$SCRIPT_DIR" # Assume script is in project root

echo "Building all services in $PROJECT_ROOT..."

echo "Building main server (qws-gateway)..."
cd "$PROJECT_ROOT/src"
npm install
npm run build

echo "Building calibration-poller..."
cd "$PROJECT_ROOT/services/calibration-poller"
npm install
npm run build

echo "Building delay-player..."
cd "$PROJECT_ROOT/services/delay-player"
npm install
npm run build

echo "Building upload-service..."
cd "$PROJECT_ROOT/services/upload-service"
npm install
npm run build

echo "Building planner service..."
cd "$PROJECT_ROOT/services/planner"
npm install
npm run build

echo "Building UI..."
cd "$PROJECT_ROOT/ui"
npm install
npm run build

echo "All services built successfully!"
cd "$PROJECT_ROOT" # Return to root directory 