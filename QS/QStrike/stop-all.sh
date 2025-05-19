#!/bin/bash

# Directory where PIDs are stored by start-all.sh
PID_DIR="/tmp/qstrike_pids"

# Function to kill a process using its PID file
kill_process() {
    local pid_file="$PID_DIR/$1.pid"
    local service_name=$1

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $service_name (PID: $pid)..."
            # Send TERM signal first, then KILL after a delay if needed
            kill "$pid"
            # Optionally wait and send KILL -9 if it doesn't stop
            # sleep 2
            # kill -0 "$pid" 2>/dev/null && kill -9 "$pid"
            rm "$pid_file"
        else
            echo "$service_name (PID: $pid) not running or PID file invalid."
            rm "$pid_file"
        fi
    else
        echo "PID file for $service_name not found."
    fi
}

echo "Stopping all QStrike services..."

kill_process "server"
kill_process "calib_poller"
kill_process "delay_player"
kill_process "upload_service"
kill_process "planner"
kill_process "replay_svc"
kill_process "alert_bot"
kill_process "ui"

echo "Cleanup: Removing PID directory $PID_DIR..."
rm -rf "$PID_DIR"

echo "All QStrike services stop signals sent." 