# QStrike - Quantum Computing Job Monitor

![CI](https://github.com/username/qstrike/workflows/CI/badge.svg)

QStrike is a real-time monitoring and visualization system for quantum computing jobs, supporting multiple providers and algorithms.

## Project Structure

QStrike is organized as a monorepo with the following structure:

- `packages/dashboard-ui`: Dashboard UI for quantum operations (React/Vite)
- `services/`: Backend microservices
- `src/`: Core gateway and API components
- `docs/`: Project documentation

## System Architecture

![Architecture Overview](docs/ARCH_OVERVIEW.svg)

## Features

- Real-time streaming of quantum job events via WebSockets
- Support for IBM, Google, IonQ, Quantinuum, and Rigetti quantum computers
- Rich visualizations of quantum algorithms including Shor, Grover, etc.
- Historical replay and data export capabilities
- Calibration monitoring and alerts
- Centralized error handling with standardized error codes
- Resource cleanup guarantees on error and disconnection
- Efficient resource utilization with consumer pooling

### 🚀 0-to-Dashboard

```bash
git clone https://github.com/your-org/qstrike
cd qstrike

# Run the dashboard UI
./run-dashboard.sh  # opens http://localhost:3000

# Or run everything
./run.sh            # starts all services including UI
```

That's it. No extra flags, no port hunting.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build all services
npm run build --workspaces

# Start dashboard UI
cd packages/dashboard-ui
npm run dev           # → http://localhost:3000
```

## Documentation

Additional documentation:
- [API Reference](docs/api/openapi.yaml)
- [Binary Protocol](BINARY-PROTOCOL.md)
- [Demo Instructions](DEMO.md)
- [Error Handling Guide](docs/ERROR-HANDLING.md)
- [Implementation Summary](IMPLEMENTATION-SUMMARY.md)
- [Fixes Summary](FIXES_SUMMARY.md)

## Metrics

Prometheus metrics are available at `/metrics` endpoint on the gateway.
Key metrics include:
- `qstrike_ack_lag`: Number of unacknowledged messages
- `qstrike_consumer_paused`: Boolean indicating if consumer is paused
- `qstrike_connected_clients`: Number of connected WebSocket clients
- `qstrike_message_rate`: Rate of messages processed per topic
- `qstrike_ws_lag_seconds`: WebSocket message delivery latency
- `qstrike_kafka_consumer_count`: Number of active Kafka consumers

## Error Handling

QStrike uses a standardized error handling approach with consistent error codes, status codes, and messages:

- Clear error code categories (AUTH, WS, KAFKA, JOB)
- Appropriate HTTP status codes for API responses
- Structured error responses with context data
- Consistent WebSocket error messages
- Proper resource cleanup on errors

See [Error Handling Guide](docs/ERROR-HANDLING.md) for more details.
