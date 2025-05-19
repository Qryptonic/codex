# OWL Advisory Group - Modular Architecture Guide

This document provides an overview of the modular architecture implemented in the OWL Advisory Group Security Scanner Demo project. It explains how the various modules are organized, interact with each other, and implement the cyberpunk-themed data collection demonstrations.

## Modular System Overview

The project has been refactored from a monolithic structure into a modular architecture that improves maintainability, scalability, and code organization. The modules are designed to handle specific aspects of the application's functionality while maintaining the cyberpunk aesthetic.

### Module Organization

```
js/
├── config.js                  # Core configuration and feature detection
├── main.js                    # Application initialization and screen management
├── data-collection.js         # Data collection coordinator (delegates to modules)
├── event-listeners.js         # Event handling and user interaction
├── sw.js                      # Service worker for offline capabilities
└── modules/
    ├── core.js                # Core utilities and helper functions
    ├── browser-info.js        # Browser detection and information
    ├── browser-interfaces.js  # Modern browser API interfaces
    ├── fingerprinting.js      # Browser fingerprinting techniques
    ├── behavioral-analysis.js # User behavior tracking and analysis
    ├── hardware-analysis.js   # Hardware profiling and analysis
    ├── system-state.js        # System state monitoring
    ├── background-state.js    # Background/tab visibility tracking
    ├── network.js             # Network information and analysis
    ├── sensors-permissions.js # Device sensors and permission requests
    ├── hardware-connect.js    # Hardware connection interfaces
    ├── data-collection-api.js # Main API for coordinated collection
    ├── offload-worker.js      # Web Worker for intensive tasks
    └── worker-helper.js       # Helper for worker communication
```

## Module Responsibilities

### Core Modules

#### `core.js`
Provides essential utilities used throughout the application:
* DOM manipulation helpers
* Data formatting functions
* Throttling/debouncing utilities
* Timing functions
* Hash generation utilities
* Universal logging with severity levels

```javascript
// Example core.js functionality
export function generateHash(input) {
    let hash = 0;
    if (input.length === 0) return hash;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

export function throttle(func, limit) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}
```

#### `browser-info.js`
Detects and analyzes browser information:
* Browser name and version detection
* Feature support detection
* Plugin enumeration
* Language preferences
* Cookie and privacy settings

```javascript
// Example browser-info.js functionality
export function detectBrowser() {
    const ua = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "";
    
    // Detection logic...
    
    return {
        name: browserName,
        version: browserVersion,
        userAgent: ua,
        language: navigator.language,
        languages: navigator.languages || [navigator.language],
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || "unspecified"
    };
}
```

### Fingerprinting Modules

#### `fingerprinting.js`
Implements various browser fingerprinting techniques:
* Canvas fingerprinting
* WebGL fingerprinting
* Audio fingerprinting
* Font detection
* Combined fingerprint generation
* Fingerprint correlation analysis

```javascript
// Example fingerprinting.js functionality
export function generateCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Add specific rendering instructions to create unique output
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("OWL Scan: ", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Fingerprint", 4, 17);
    
    return generateHash(canvas.toDataURL());
}
```

### Behavioral Analysis

#### `behavioral-analysis.js`
Tracks and analyzes user behavior patterns:
* Mouse movement tracking
* Click pattern analysis
* Keystroke dynamics
* Scroll behavior monitoring
* Interaction heatmap generation
* Typing speed categorization

```javascript
// Example behavioral-analysis.js functionality
export function trackMouseMovement(event, appState) {
    if (!appState.dataCollectionActive) return;
    
    const now = performance.now();
    const pos = { x: event.clientX, y: event.clientY, time: now };
    
    // Limit array size to prevent memory issues
    if (appState.cursorPositions.length >= 100) {
        appState.cursorPositions.shift();
    }
    
    appState.cursorPositions.push(pos);
    analyzeMovementSpeed(appState);
}

export function trackKeypress(event, appState) {
    if (!appState.dataCollectionActive) return;
    if (event.key.length !== 1 && !['Enter', 'Backspace', 'Tab'].includes(event.key)) return;
    
    const now = performance.now();
    const keyData = { key: event.key, time: now };
    
    // Limit array size
    if (appState.keysPressed.length >= 50) {
        appState.keysPressed.shift();
    }
    
    appState.keysPressed.push(keyData);
    analyzeTypingDynamics(appState);
}
```

### Hardware & System Analysis

#### `hardware-analysis.js`
Profiles hardware capabilities and constraints:
* CPU core detection
* Memory estimation
* Device enumeration
* Performance timing benchmarks
* GPU capabilities

#### `system-state.js`
Monitors system state information:
* Battery status
* Network connection type
* Device orientation
* Screen information
* Memory usage

```javascript
// Example system-state.js functionality
export async function getBatteryInfo() {
    if (!navigator.getBattery) {
        return { level: 0.87, charging: true, chargingTime: 3600, dischargingTime: Infinity };
    }
    
    try {
        const battery = await navigator.getBattery();
        return {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
        };
    } catch (err) {
        console.error("Error getting battery info:", err);
        return { level: 0.75, charging: true, chargingTime: 1800, dischargingTime: Infinity };
    }
}
```

### Network & Communication

#### `network.js`
Gathers network-related information:
* Connection type detection
* Bandwidth estimation
* IP detection (simulated)
* Network latency measurement
* Connection visualization

```javascript
// Example network.js functionality
export function getNetworkInformation() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
        return {
            type: "unknown",
            effectiveType: "4g",
            downlink: 10,
            rtt: 50,
            saveData: false
        };
    }
    
    return {
        type: connection.type || "unknown",
        effectiveType: connection.effectiveType || "4g",
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 50,
        saveData: connection.saveData || false
    };
}
```

### Permission & Hardware Access

#### `sensors-permissions.js`
Manages permission requests and sensor access:
* Camera permissions
* Microphone permissions
* Geolocation access
* Notification permissions
* Device sensor access

```javascript
// Example sensors-permissions.js functionality
export async function requestGeolocation() {
    if (!navigator.geolocation) {
        return { error: "Geolocation API not available" };
    }
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
        
        return {
            coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            },
            timestamp: position.timestamp
        };
    } catch (err) {
        return { error: err.message };
    }
}
```

### Worker & Performance

#### `offload-worker.js`
Implements a Web Worker for CPU-intensive tasks:
* Fingerprint correlation calculations
* Hash generation
* Data analysis
* Complex visualizations

#### `worker-helper.js`
Facilitates communication with the worker:
* Message passing interface
* Task scheduling
* Progress reporting
* Error handling

```javascript
// Example worker-helper.js functionality
export function createWorker() {
    const worker = new Worker('js/modules/offload-worker.js');
    
    return {
        executeTask: function(taskName, data) {
            return new Promise((resolve, reject) => {
                const messageId = Date.now().toString();
                
                const messageHandler = function(e) {
                    if (e.data.messageId !== messageId) return;
                    
                    if (e.data.error) {
                        worker.removeEventListener('message', messageHandler);
                        reject(new Error(e.data.error));
                        return;
                    }
                    
                    if (e.data.progress) {
                        // Report progress
                        return;
                    }
                    
                    if (e.data.complete) {
                        worker.removeEventListener('message', messageHandler);
                        resolve(e.data.result);
                    }
                };
                
                worker.addEventListener('message', messageHandler);
                worker.postMessage({ 
                    messageId, 
                    taskName, 
                    data 
                });
            });
        },
        terminate: function() {
            worker.terminate();
        }
    };
}
```

## Integration Architecture

### Main API

#### `data-collection-api.js`
Serves as the primary entry point for coordinating data collection across modules:

```javascript
// Example data-collection-api.js functionality
import * as Core from './core.js';
import * as BrowserInfo from './browser-info.js';
import * as Fingerprinting from './fingerprinting.js';
import * as BehavioralAnalysis from './behavioral-analysis.js';
import * as HardwareAnalysis from './hardware-analysis.js';
import * as SystemState from './system-state.js';
import * as Network from './network.js';
import * as SensorsPermissions from './sensors-permissions.js';

// Master control flag checker
export function canCollectData(appState) {
    return appState.dataCollectionActive === true;
}

// Main initialization
export async function initializeCollection(appState) {
    if (!canCollectData(appState)) {
        console.log('Data collection not yet authorized');
        return false;
    }
    
    // Initialize all collection modules
    appState.browserInfo = await BrowserInfo.detectBrowser();
    appState.fingerprints = {
        canvas: Fingerprinting.generateCanvasFingerprint(),
        webgl: Fingerprinting.generateWebGLFingerprint(),
        audio: await Fingerprinting.generateAudioFingerprint(),
        basic: Fingerprinting.generateBasicFingerprint()
    };
    appState.networkInfo = Network.getNetworkInformation();
    appState.systemInfo = await SystemState.getSystemInformation();
    
    // Setup throttled event handlers
    appState.throttledHandlers = {
        mouseMove: Core.throttle((e) => {
            BehavioralAnalysis.trackMouseMovement(e, appState);
        }, 50),
        keyPress: (e) => {
            BehavioralAnalysis.trackKeypress(e, appState);
        },
        scroll: Core.throttle(() => {
            BehavioralAnalysis.trackScrollDepth(appState);
        }, 100)
    };
    
    return true;
}

// Permission request facades
export async function requestCamera() {
    return await SensorsPermissions.requestCamera();
}

export async function requestMicrophone() {
    return await SensorsPermissions.requestMicrophone();
}

export async function requestLocation() {
    return await SensorsPermissions.requestGeolocation();
}

// Analysis methods
export async function analyzeFingerprints(fingerprints) {
    // Use the worker for intensive calculations
    const worker = createWorker();
    try {
        return await worker.executeTask('analyzeFingerprints', fingerprints);
    } finally {
        worker.terminate();
    }
}
```

## Data Flow Architecture

### Top-Level Flow

1. `main.js` initializes the application and manages screen transitions
2. When the user reaches the dashboard, `dataCollectionActive` is set to true
3. `data-collection.js` coordinates with `data-collection-api.js` to initialize all modules
4. Event listeners in `event-listeners.js` use throttled handlers from the API
5. Each module performs its specific data collection and analysis functions
6. Results are stored in the global `appState` object
7. UI components read from `appState` to display collected information

### State Management

The application uses a central `appState` object to manage state:

```javascript
const appState = {
    // Core application state
    currentScreen: 'landing',       // Current active screen
    dataCollectionActive: false,    // Master control flag
    userIdentifier: '',             // User-provided identifier
    sessionId: generateSessionId(), // Unique session ID
    startTime: Date.now(),          // Session start timestamp
    
    // Collection data buckets
    browserInfo: {},                // Browser information
    systemInfo: {},                 // System information
    networkInfo: {},                // Network information
    fingerprints: {},               // Fingerprinting results
    locationInfo: {},               // Geolocation data
    permissionStatus: {},           // Permission states
    
    // Behavioral tracking data
    cursorPositions: [],            // Mouse movement history
    keysPressed: [],                // Keystroke history
    clickInfo: { count: 0 },        // Click statistics
    scrollInfo: { depth: 0 },       // Scroll statistics
    
    // UI state
    uiState: {
        statusMessages: [],         // Status message queue
        activeVisualizations: [],   // Active visualization elements
        alertLevel: 'normal'        // Current alert level
    }
};
```

## Event Flow

### Initialization

```
1. main.js initializes the application
2. config.js performs feature detection
3. event-listeners.js sets up basic UI event listeners
4. User is presented with the landing screen
```

### User Consent Flow

```
1. User provides identifier and checks consent checkbox
2. User clicks "AUTHORIZE SCAN"
3. Screen transitions to assessment
4. Assessment simulation runs
5. User clicks "CONTINUE TO DASHBOARD"
6. dataCollectionActive is set to true
7. data-collection-api.js initializes all collection modules
8. Full event listeners are attached
9. Dashboard displays collected information
```

### Dashboard Interaction

```
1. User clicks permission request buttons
2. sensors-permissions.js handles permission requests
3. UI updates to show permission status
4. User interacts with dashboard elements
5. behavioral-analysis.js tracks interactions
6. Dashboard panels update in real-time
```

## Module Communication

Modules communicate primarily through function calls and the central `appState` object. This approach balances modularity with practical state management:

1. **Direct Function Calls**: For synchronous operations within a module
2. **Promise-Based APIs**: For asynchronous operations like permission requests
3. **State Updates**: Modules read from and write to the central `appState`
4. **Worker Messages**: For CPU-intensive operations offloaded to Web Workers

## Implementation Guidelines

### Adding New Modules

When adding a new module:

1. Create a new file in the `js/modules/` directory
2. Export functionality using ES modules pattern
3. Implement necessary feature detection
4. Update `data-collection-api.js` to integrate the new module
5. Ensure all functions check the `dataCollectionActive` flag

Example new module template:

```javascript
// myNewFeature.js

// Feature detection
const isFeatureAvailable = !!window.someAPI;

// Public API
export function initializeFeature() {
    if (!isFeatureAvailable) {
        return { error: 'Feature not available' };
    }
    
    // Implementation...
    return { status: 'initialized' };
}

export function collectFeatureData(appState) {
    // Always check the permission flag
    if (!appState.dataCollectionActive) {
        return false;
    }
    
    // Collection logic...
    return featureData;
}
```

### Module Principles

1. **Single Responsibility**: Each module should handle one aspect of functionality
2. **Explicit Dependencies**: Import only what is needed from other modules
3. **Error Handling**: Gracefully handle missing features or permissions
4. **Permission Checking**: Always respect the `dataCollectionActive` flag
5. **Feature Detection**: Check for feature availability before using it
6. **Fallbacks**: Provide fallback behavior when features aren't available
7. **Performance**: Use throttling/debouncing for high-frequency events

## Conclusion

The modular architecture of the OWL Advisory Group Security Scanner Demo enhances maintainability, scalability, and organization while preserving the cyberpunk aesthetic and educational purpose of the application. By segregating functionality into focused modules, the codebase becomes more manageable and extensible for future development.

Each module contributes to the overall demonstration of browser data collection capabilities while respecting user privacy through the strict data collection control mechanism centered around the `dataCollectionActive` flag.

---

© 2023 Owl Advisory Group - Security Scanner Demo | *For educational purposes only*
