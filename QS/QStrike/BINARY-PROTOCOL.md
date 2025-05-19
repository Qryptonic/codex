# QStrike Binary WebSocket Protocol

This document describes the binary WebSocket protocol used by QStrike for quantum event streaming.

## Protocol Overview

QStrike uses a binary protocol over WebSockets to efficiently stream quantum computation events. The protocol has the following key characteristics:

1. **Authentication**: JWT token with subject (`sub`) claim for client identification
2. **Tenant Isolation**: Job owner verification against JWT subject claim
3. **Binary Data Format**: Avro-encoded binary messages (no JSON encoding)
4. **Flow Control**: ACK-based backpressure mechanism to prevent memory issues
5. **Error Handling**: Plain text error messages with `ERROR:` prefix

## Connection Establishment

### Live Stream Route

```
GET /ws/jobs/:jobId/stream
```

**Headers:**
- `Authorization: Bearer <jwt-token>`

**Parameters:**
- `jobId`: ID of the quantum job to stream

### Delayed Stream Route

```
GET /ws/delay/:streamId?token=<jwt-token>
```

**Parameters:**
- `streamId`: ID of the delayed stream
- `token`: JWT token (as query parameter)

## Message Flow

1. **Binary Messages (Server → Client)**:
   - Raw Avro-encoded binary buffers sent from server to client
   - Client decodes using Avro schema
   - No intermediate JSON encoding/decoding

2. **ACK Messages (Client → Server)**:
   - Client sends plain text `'ACK'` after receiving a batch of messages
   - Default threshold is 200 messages before sending ACK
   - Server resets queue counter and resumes consumer if paused

3. **Error Messages (Server → Client)**:
   - Plain text format with `ERROR:` prefix
   - Example: `ERROR: Authentication failed: Missing sub claim`

4. **Ping/Pong Messages**:
   - Client sends `'ping'` every 30 seconds
   - Server responds with `'pong'`
   - No response within 10 seconds triggers reconnection

## Flow Control

The protocol implements an ACK-based flow control mechanism:

1. Server tracks number of sent messages since last ACK
2. When queue exceeds threshold (500 messages):
   - Server pauses Kafka consumer
   - Server logs pause event
3. When client sends ACK:
   - Server resets message counter
   - Server resumes Kafka consumer if paused
   - Server logs resume event

## Event Schema

Events are encoded using Apache Avro schema defined in `QuantumEvent.avsc`:

```json
{
  "namespace": "com.qstrike",
  "protocol": "QE",
  "type": "record",
  "name": "QuantumEvent",
  "fields": [
    {"name": "jobId", "type": "string"},
    {"name": "ts", "type": "long", "logicalType": "timestamp-millis"},
    {"name": "algo", "type": {"type": "enum", "name": "Algo", "symbols": ["SHOR", "GROVER", "ECC"]}},
    {"name": "provider", "type": {"type": "enum", "name": "Cloud", "symbols": ["IBM", "GOOGLE", "IONQ", "QUANTINUUM", "RIGETTI"]}},
    {"name": "phase", "type": "string"},
    {"name": "logicalQubits", "type": "int"},
    {"name": "physicalQubits", "type": "int"},
    {"name": "circuitDepth", "type": "int"},
    {"name": "gateError", "type": "double"},
    {"name": "fidelity", "type": "double"},
    {"name": "progressPct", "type": "float"},
    {"name": "etaSec", "type": "int"},
    {"name": "pSuccess", "type": "float"},
    {"name": "scaledEtaSec", "type": ["null", "int"], "default": null}
  ]
}
```

## Error Codes

| Code | Reason | Description |
|------|--------|-------------|
| 4001 | Auth failed | Authentication token invalid or missing |
| 4003 | Tenant isolation violation | JWT subject doesn't match job owner |
| 4011 | Authorization error | Error checking job ownership |
| 1000 | Normal closure | Clean disconnection |
| 1001 | Going away | Gateway shutting down |
| 1011 | Server error | Server encountered error |

## Testing the Protocol

Use the included test script to validate the binary protocol:

```bash
# Start infrastructure
docker compose up -d redpanda schema-registry

# Start server
cd src
npm run build
npm start

# In another terminal
cd src
npm run produce-test-event  # Send test event to Kafka
npm run test-binary         # Run binary protocol test
```

## Client Implementation Notes

1. Set WebSocket `binaryType` to `'arraybuffer'` to handle binary messages
2. Implement Avro decoding on the client side
3. Send ACK messages after processing a batch of events
4. Handle reconnection with exponential backoff on unexpected disconnects