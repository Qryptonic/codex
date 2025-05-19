#!/bin/bash
set -e

echo "Starting QStrike development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Navigate to the project directory (in case script is called from elsewhere)
cd "$(dirname "$0")"

# Ensure we have the latest images
echo "Pulling latest Docker images..."
docker-compose -f infra/docker-compose.dev.yml pull

# Start the development environment with full-stack profile
echo "Starting development services..."
docker-compose -f infra/docker-compose.dev.yml --profile full-stack up -d

# Wait for services to be healthy
echo "Waiting for services to become healthy..."
attempt=0
max_attempts=30

while true; do
  healthy_count=$(docker-compose -f infra/docker-compose.dev.yml ps --format "{{.State}}" | grep -c "running (healthy)" || echo 0)
  service_count=$(docker-compose -f infra/docker-compose.dev.yml ps --format "{{.State}}" | grep -c "running" || echo 0)
  
  if [ $healthy_count -eq $service_count ]; then
    echo "All services are healthy!"
    break
  fi
  
  attempt=$((attempt+1))
  if [ $attempt -ge $max_attempts ]; then
    echo "Timeout waiting for services to become healthy."
    docker-compose -f infra/docker-compose.dev.yml ps
    echo "Some services may still be starting. Check logs with: docker-compose -f infra/docker-compose.dev.yml logs -f"
    break
  fi
  
  echo "Waiting for services to become healthy ($attempt/$max_attempts)..."
  sleep 5
done

# Show status of all services
echo "Current service status:"
docker-compose -f infra/docker-compose.dev.yml ps --format table

# Open the dashboard in browser if available
if command -v open > /dev/null; then
  echo "Opening dashboard in browser..."
  open http://localhost:${PORT:-3000}/
elif command -v xdg-open > /dev/null; then
  echo "Opening dashboard in browser..."
  xdg-open http://localhost:${PORT:-3000}/
fi

echo "Services started successfully!"
echo "Dashboard URL: http://localhost:${PORT:-3000}/"
echo "Gateway metrics: http://localhost:8080/metrics/kafka"
echo "To stop all services, run: docker-compose -f infra/docker-compose.dev.yml down"
echo ""
echo "To view logs, run: docker-compose -f infra/docker-compose.dev.yml logs -f"