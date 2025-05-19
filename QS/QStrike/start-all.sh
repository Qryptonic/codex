#!/bin/bash

# Get the directory where the script resides
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Starting all QStrike services in $PROJECT_ROOT..."

# Define PID file directory
PID_DIR="/tmp/qstrike_pids"
mkdir -p "$PID_DIR"

echo "Starting main WebSocket server (qws-gateway)..."
cd "$PROJECT_ROOT/src"
# Start in background and store PID
npm start &> "$PID_DIR/server.log" & 
SERVER_PID=$!
echo $SERVER_PID > "$PID_DIR/server.pid"
sleep 1 # Small delay between starts

echo "Starting calibration-poller..."
cd "$PROJECT_ROOT/services/calibration-poller"
npm start &> "$PID_DIR/calib_poller.log" & 
CALIB_POLLER_PID=$!
echo $CALIB_POLLER_PID > "$PID_DIR/calib_poller.pid"
sleep 1

echo "Starting delay-player..."
cd "$PROJECT_ROOT/services/delay-player"
npm start &> "$PID_DIR/delay_player.log" & 
DELAY_PLAYER_PID=$!
echo $DELAY_PLAYER_PID > "$PID_DIR/delay_player.pid"
sleep 1

echo "Starting upload-service..."
cd "$PROJECT_ROOT/services/upload-service"
npm start &> "$PID_DIR/upload_service.log" & 
UPLOAD_SERVICE_PID=$!
echo $UPLOAD_SERVICE_PID > "$PID_DIR/upload_service.pid"
sleep 1

# Starting planner service (assuming it's meant to run)
echo "Starting planner service..."
cd "$PROJECT_ROOT/services/planner"
npm start &> "$PID_DIR/planner.log" & 
PLANNER_PID=$!
echo $PLANNER_PID > "$PID_DIR/planner.pid"
sleep 1

# Starting replay service (assuming python env is set up)
echo "Starting replay service..."
cd "$PROJECT_ROOT/services/replay-svc"
# Adjust python command if using virtualenv
python app.py &> "$PID_DIR/replay_svc.log" & 
REPLAY_SVC_PID=$!
echo $REPLAY_SVC_PID > "$PID_DIR/replay_svc.pid"
sleep 1

# Starting alert bot (assuming python env is set up)
echo "Starting alert bot..."
cd "$PROJECT_ROOT/services/alert-bot"
# Adjust python command if using virtualenv
python alert_bot.py &> "$PID_DIR/alert_bot.log" & 
ALERT_BOT_PID=$!
echo $ALERT_BOT_PID > "$PID_DIR/alert_bot.pid"
sleep 1

echo "Starting UI development server..."
cd "$PROJECT_ROOT/ui"
# Use --host to make it accessible externally if needed from docker/VM
npm run dev -- --host &> "$PID_DIR/ui.log" & 
UI_PID=$!
echo $UI_PID > "$PID_DIR/ui.pid"

echo "-------------------------------------"
echo "All services started in background."
echo "Log files located in $PID_DIR"
echo "UI accessible at http://localhost:5173 (Vite default)"
echo "Run './stop-all.sh' to stop services."
echo "-------------------------------------"

# Note: Removed 'wait' command as it's not suitable for detached background processes like this.
# Use './stop-all.sh' for cleanup. 