# One-button Developer Bootstrap

This PR adds a streamlined setup for developers to get QStrike up and running quickly with just one command.

## Problem

Previously, getting started with QStrike required multiple steps and commands, with potential for configuration mismatches between different parts of the system. Developers had to:

1. Set up environment variables manually
2. Start Docker containers separately
3. Run the UI with specific flags
4. Deal with inconsistent port configurations

## Solution

The solution standardizes all configuration around port 3000 and provides a simple one-command bootstrap:

```bash
./run.sh
```

This opens a fully functional dashboard at http://localhost:3000 with no additional flags or configuration needed.

## Implementation Details

1. **Single Source of Truth for Port Configuration**
   - In `vite.config.ts`: `const PORT = Number(process.env.PORT) || 3000;`
   - All port references now use this constant

2. **Simplified Bootstrap Script**
   - Added `run.sh` that starts backend services and the UI with one command
   - Properly handles port overrides: `PORT=4000 ./run.sh` works seamlessly
   - Includes help flag (`./run.sh -h`) and cleanup option (`./run.sh --stop`)
   - Graceful cleanup on Ctrl-C with trap handlers
   - Colored status output for better visual feedback
   - Node version validation to prevent common setup issues

3. **Docker Configuration**
   - Updated `docker-compose.dev.yml` to use the standardized port
   - Added environment variables to ensure consistent configuration

4. **Health Endpoint**
   - Added `/__health` endpoint that returns "OK" for easy status checking
   - Configured in workflows for CI verification

5. **Documentation Updates**
   - Simplified "Getting Started" section in README
   - Added concise instructions that actually work

## Testing Done

- Verified full stack runs with just `./run.sh`
- Tested port overrides work with `PORT=4000 ./run.sh`
- Confirmed health endpoint works
- Ensured CI smoke test passes

## Reviewer Notes

The main value here is that new developers can clone the repo and immediately run the dashboard with a single command, without having to learn all the system components first.