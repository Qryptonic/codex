# QStrike Project Deliverables

## Today's Completed Items

1. **Binary WebSocket Protocol**
   - Gateway now correctly passes raw binary Avro buffers to clients
   - UI embeds Avro schema directly in the code, no more network fetching
   - ACK flow-control implemented (client sends 'ACK', server resumes consumer)

2. **Authorization & Security**
   - Implemented strict JWT subject claim validation
   - Tenant isolation ensured by matching JWT sub with job owner
   - Enhanced error logging and security message responses

3. **Flow Control & Backpressure**
   - Implemented consumer pause/resume with message counting
   - Server pauses after 500 unacknowledged messages
   - Client sends ACK to reset counter and resume flow

4. **Infrastructure Health Checks**
   - Added health checks to Redpanda and Schema Registry in docker-compose.yml
   - Service dependencies now respect health check status
   - Gateway health endpoint properly reports Kafka connectivity

5. **Testing**
   - Added Jest test for `useEvents.ts` to verify ACK sending
   - Test validates binary message handling and WebSocket connection management

## How to Run the Demo

```bash
# 1. Bring everything up with proper sequencing
cd QStrike
docker compose down -v
docker compose up -d

# 2. Produce a sample event (requires Redpanda running)
cat test-event.json | docker compose exec redpanda rpk topic produce qstrike.events

# 3. Open UI
open http://localhost:3000

# 4. Check DevTools > Network > WS > Frames
# Should show:
# - Binary messages coming from server
# - "ACK" messages sent from client
```

## Remaining Tasks for Next Sprint

1. **Validator Stream Safety**
   - Current validator memory-loads large JSON arrays
   - Need to switch to streaming parser (e.g., `JSONStream.parse('*')`)
   - Add size limit check (fail arrays > 50 MB)

2. **Helm Configuration**
   - Create production-ready `values-prod.yaml`
   - Pin all image tags and environment secrets
   - Implement resource limits and readiness probes

3. **CI Pipeline**
   - Complete GitHub Actions workflow
   - Add Jest and Cypress tests to CI
   - Publish test results and coverage

4. **Monitoring Dashboard**
   - Export Grafana dashboards for latency and provider health
   - Add custom alerts for queue depth and consumer lag
   - Documentation for operational metrics

## Proof of Completion

- [x] Server sends binary Avro messages (verified in browser DevTools)
- [x] UI decodes Avro binary data correctly
- [x] Client sends ACK messages for flow control
- [x] JWT subject claim verified against job owner
- [x] Added tests for WebSocket ACK mechanism
- [x] Updated docker-compose.yml with proper health checks