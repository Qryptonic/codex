# PR: feat(stabilise): green build + live data end-to-end

This PR addresses key stability issues in the QStrike project to enable end-to-end live data flow from Kafka to the frontend. The changes include build system fixes, ESLint configuration updates, Kafka consumer pooling integration, graceful shutdown handling, and proper WebSocket URL configuration for live data support.

## Key Changes

### 1. Build and Lint Fixes
- Fixed `ui/tsconfig.json` by adding `"noEmit": false` and other required options
- Updated ESLint configuration to properly handle JS/TS files separately
- Added separate lint scripts for JS and TS files to avoid parser conflicts
- Removed outdated nodePolyfills configuration in Vite

### 2. Kafka Consumer Pooling
- Integrated KafkaConsumerPool singleton in gateway core
- Added `/metrics/kafka` endpoint to expose consumer pool metrics
- Properly wired WebSocket routes to use the consumer pool

### 3. Graceful Shutdown and Development Environment
- Added proper SIGTERM/SIGINT handlers for clean application shutdown
- Created `docker-compose.dev.yml` for development environment setup
- Implemented one-liner startup script (`run-dev.sh`) for easy environment launch

### 4. WebSocket Live Data
- Updated WebSocket URL handling to support environment-specific configurations
- Added environment variables for WebSocket host and protocol override
- Created `.env.development` file for local development settings
- Added WebSocket connection smoke test

## Testing Performed
- Verified successful UI build with `npm run build --workspace qstrike-ui`
- Confirmed ESLint running with proper configuration for both TS and JS files
- Created test for WebSocket connection handling with environment overrides

## Screenshots
[Link to live dashboard screenshot showing real-time data from Kafka]