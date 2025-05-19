#!/bin/bash

# QStrike 5.1 Demo Runner

# --- Configuration ---
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" # Assumes script is in /scripts
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/infra/docker-compose.yml"
REDPANDA_CONTAINER_NAME="infra-redpanda-1" # Match service name + number
UPLOAD_SERVICE_URL="http://localhost:3000" # Exposed UI/Upload service port
UI_URL="http://localhost:3000"
DEMO_DATA_FILE="${PROJECT_ROOT}/docs/demo/rsa2048.ndjson"

# Kafka Topics to create
KAFKA_TOPICS=("qstrike.raw" "qstrike.events" "qstrike.uploads") 
# Add any delay topics needed for mock data or specific demos, e.g.:
# KAFKA_TOPICS+=("qstrike.delay.mock-rsa2048")

# --- Helper Functions ---
function check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "Error: Required command '$1' not found. Please install it." >&2
    exit 1
  fi
}

function wait_for_service() {
  local url=$1
  local service_name=$2
  local max_retries=30
  local delay=2
  local count=0

  echo -n "Waiting for ${service_name} at ${url} to be ready..."
  while ! curl --output /dev/null --silent --head --fail "${url}"; do
    count=$((count + 1))
    if [ ${count} -ge ${max_retries} ]; then
      echo " Timeout!"
      echo "Error: ${service_name} did not become available after $((max_retries * delay)) seconds." >&2
      exit 1
    fi
    echo -n "."
    sleep ${delay}
  done
  echo " Ready!"
}

function create_kafka_topics() {
  echo "Creating Kafka topics..."
  local topics_created=0
  for topic in "${KAFKA_TOPICS[@]}"; do
    echo -n "  - Creating topic '${topic}': "
    # Use --if-not-exists equivalent behavior if possible, or ignore errors
    if docker exec "${REDPANDA_CONTAINER_NAME}" rpk topic create "${topic}"; then
      echo "OK"
      topics_created=$((topics_created + 1))
    else
      # Check if topic already exists (exit code 49 is often 'TopicAlreadyExists')
      local exit_code=$?
      if [ $exit_code -eq 49 ]; then
          echo "Already exists."
          topics_created=$((topics_created + 1))
      else
          echo "Failed (Exit code: ${exit_code})."
      fi
    fi
  done
  if [ "${topics_created}" -eq "${#KAFKA_TOPICS[@]}" ]; then
      echo "All required topics created or already exist."
  else
      echo "Warning: Not all Kafka topics could be created." >&2
      # Decide if this is fatal
      # exit 1 
  fi
}

# --- Main Script Logic ---

# 0. Check Prerequisites
check_command docker
check_command docker-compose
check_command curl
check_command date # For sim-drift.sh dependency

# 1. Navigate to Project Root
echo "Changing to project directory: ${PROJECT_ROOT}"
cd "${PROJECT_ROOT}" || { echo "Error: Failed to change directory to ${PROJECT_ROOT}"; exit 1; }

# 2. Start Infrastructure
echo "Starting infrastructure with Docker Compose... (File: ${DOCKER_COMPOSE_FILE})"
if ! docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d --build; then
    echo "Error: Docker Compose failed to start." >&2
    exit 1
fi
echo "Infrastructure starting in the background."

# 3. Wait for Key Services (adjust URLs/ports as needed)
echo "Waiting for services to initialize..."
sleep 10 # Initial sleep for containers to spin up
wait_for_service "${UPLOAD_SERVICE_URL}/health" "Upload Service" # Assuming a /health endpoint exists
# Add waits for other critical services if needed (Redpanda, Schema Registry?)

# 4. Create Kafka Topics
create_kafka_topics

# 5. Load Sample Data via Upload Service
echo "Loading demo data (${DEMO_DATA_FILE})..."
if [ ! -f "${DEMO_DATA_FILE}" ]; then
    echo "Error: Demo data file not found at ${DEMO_DATA_FILE}" >&2
    exit 1
fi

UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -F "file=@${DEMO_DATA_FILE}" \
  -F "startAt=+5s" \
  -F "speed=15" \
  "${UPLOAD_SERVICE_URL}/api/upload")

UPLOAD_HTTP_CODE=$(echo "${UPLOAD_RESPONSE}" | tail -n1)
UPLOAD_BODY=$(echo "${UPLOAD_RESPONSE}" | sed '$d')

if [ "${UPLOAD_HTTP_CODE}" -eq 201 ]; then
    echo "Demo data uploaded successfully." 
    echo "Response: ${UPLOAD_BODY}"
else
    echo "Error: Failed to upload demo data (HTTP Status: ${UPLOAD_HTTP_CODE})." >&2
    echo "Response Body: ${UPLOAD_BODY}" >&2
    # Optional: docker-compose logs upload-service
    # exit 1 # Decide if this is fatal
fi

# 6. Open Browser (Optional)
echo "---------------------------------------------------"
echo "QStrike Demo Setup Complete!" 
echo "Dashboard should be available at: ${UI_URL}"
echo "---------------------------------------------------"
echo "Attempting to open dashboard in your default browser..."

case "$(uname -s)" in
   Darwin)  open "${UI_URL}" ;;
   Linux)   xdg-open "${UI_URL}" ;;
   CYGWIN*|MINGW*|MSYS*|WINDOWS*) start "${UI_URL}" ;;
   *)       echo "Please open ${UI_URL} in your web browser manually." ;;
esac

echo " "
echo "To simulate a gate error drift event, run: ./scripts/sim-drift.sh"
echo "To stop the demo and clean up containers, run: make clean"

exit 0 