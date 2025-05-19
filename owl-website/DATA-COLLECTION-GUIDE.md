# OWL Advisory Group - Data Collection & Controls Guide

This document provides a comprehensive overview of all data collection points and user controls implemented in the OWL Advisory Group Security Scanner Demo.

> ⚠️ **EDUCATIONAL PURPOSE ONLY**: This application demonstrates data collection capabilities of modern web browsers with explicit user consent. It is designed for educational purposes to raise awareness about digital privacy.

## Core Privacy Protection Model

The OWL website implements a strict privacy protection model with multiple safeguards:

1. **Three-Stage User Flow**: Users must explicitly navigate through three screens before any data collection begins:
   - Landing screen with consent checkbox
   - Assessment simulation screen
   - Dashboard screen (only here does data collection activate)

2. **Critical Data Protection Control**: The `dataCollectionActive` flag in the global `appState` object is the master switch that prevents ANY data collection until users complete all consent steps.

3. **Zero Collection Before Consent**: Even passive data like cursor position or keystrokes are NOT collected until after full consent flow completes.

4. **Local Processing Only**: All collected data remains in the browser - no external transmission.

## Data Collection Points

### Identity & User Information

| Data Point | Collection Method | Storage Location | Notes |
|------------|-------------------|------------------|-------|
| **User Identifier** | Input field on landing page | `appState.userIdentifier` | Required to proceed |
| **Session ID** | Generated (user agent hash + timestamp) | `appState.sessionId` | Created on initial load |
| **IP Address** | Simulated with placeholder values | Displayed only | Shows "FETCHING..." |
| **Local Time** | `new Date()` | `appState.startTime` | Used for session duration |
| **Timezone** | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Displayed only | Shows local timezone |

### Browser & System Information

| Data Point | Collection Method | Storage Location | Notes |
|------------|-------------------|------------------|-------|
| **Browser Name/Version** | User agent parsing | `appState.browserInfo` | Detected on load |
| **User Agent String** | `navigator.userAgent` | `appState.browserInfo.userAgent` | Full UA string |
| **Cookie Settings** | `navigator.cookieEnabled` | `appState.browserInfo.cookiesEnabled` | Boolean value |
| **Do Not Track Status** | `navigator.doNotTrack` | `appState.browserInfo.doNotTrack` | Respects DNT |
| **Plugins** | `navigator.plugins` | `appState.browserInfo.plugins` | Array of plugins |
| **Device Type** | User agent inference | `appState.deviceInfo.type` | Mobile/Desktop |
| **Operating System** | User agent parsing | `appState.deviceInfo.os` | Name and version |
| **CPU Cores** | `navigator.hardwareConcurrency` | `appState.systemInfo.cores` | Number of cores |
| **Memory** | Simulated (8GB) | Displayed only | Simulated value |
| **Screen Dimensions** | `window.screen.width/height` | `appState.screenInfo` | With pixel ratio |
| **Color Depth** | `window.screen.colorDepth` | `appState.screenInfo.colorDepth` | Color bit depth |
| **Viewport Size** | `window.innerWidth/Height` | `appState.viewportInfo` | Browser viewport |

### Fingerprinting Techniques

| Technique | Implementation | Storage Location | Notes |
|-----------|----------------|------------------|-------|
| **Canvas Fingerprint** | Canvas rendering hash | `appState.fingerprints.canvas` | Based on text rendering |
| **Audio Fingerprint** | AudioContext analysis | `appState.fingerprints.audio` | Based on signal processing |
| **WebGL Fingerprint** | WebGL rendering hash | `appState.fingerprints.webgl` | Based on 3D rendering |
| **Basic Fingerprint** | Combined browser properties | `appState.fingerprints.basic` | Multiple factors |
| **Font Detection** | Simulated (40 detected) | Displayed only | Visual representation |

### Behavioral Tracking

| Behavior | Tracking Method | Storage Location | Notes |
|----------|-----------------|------------------|-------|
| **Mouse Movement** | `mousemove` event listener | `appState.cursorPositions` | Limited to 100 entries |
| **Movement Patterns** | Velocity calculation | `appState.cursorInfo.speed` | SLOW/NORMAL/FAST |
| **Keystroke Logging** | `keydown` event listener | `appState.keysPressed` | Limited to 50 entries |
| **Key Press Timing** | Timestamp differences | `appState.typingDynamics` | Time between keys |
| **Typing Dynamics** | Speed classification | `appState.typingDynamics.category` | Based on WPM |
| **Scroll Depth** | `scroll` event listener | `appState.scrollInfo` | Percentage of page |
| **Click Count** | `click` event listener | `appState.clickInfo.count` | Total number of clicks |
| **Time on Page** | Timer from page load | `appState.sessionInfo.duration` | In seconds |

### Storage & Memory Analysis

| Data Point | Collection Method | Storage Location | Notes |
|------------|-------------------|------------------|-------|
| **Local Storage** | Size estimation | `appState.storageInfo.localStorage` | In KB |
| **Session Storage** | Size estimation | `appState.storageInfo.sessionStorage` | In KB |
| **Available Storage** | Feature detection | `appState.storageInfo.available` | Available types |

### Permission-Based Data

| Data Type | Permission Request | Storage Location | Notes |
|-----------|-------------------|------------------|-------|
| **Camera Access** | `navigator.mediaDevices.getUserMedia({video:true})` | Permission status only | Requires user click |
| **Microphone** | `navigator.mediaDevices.getUserMedia({audio:true})` | Permission status only | Requires user click |
| **Geolocation** | `navigator.geolocation.getCurrentPosition()` | `appState.locationInfo` | Requires user click |
| **Notifications** | `Notification.requestPermission()` | Permission status only | Requires user click |

### Advanced Profiling

| Feature | Implementation | Storage Location | Notes |
|---------|----------------|------------------|-------|
| **Tab Visibility** | `document.visibilityState` | `appState.tabInfo.visible` | Active/Inactive |
| **Network Analysis** | Network connections visualization | Visual representation | Simulated nodes |
| **Battery Info** | Battery API (or simulation) | `appState.batteryInfo` | Level and charging |

## Control Mechanisms

### Critical User Controls

| Control | Implementation | Effect | Notes |
|---------|----------------|--------|-------|
| **Consent Checkbox** | Checkbox on landing screen | Required to proceed | Must be checked |
| **User Identifier** | Text input on landing screen | Required to proceed | Must be entered |
| **AUTHORIZE SCAN Button** | Transitions to assessment | Starts assessment | After consent |
| **CONTINUE TO DASHBOARD** | Transitions to dashboard | Activates data collection | After assessment |

### Dashboard Controls

| Control | Implementation | Effect | Notes |
|---------|----------------|--------|-------|
| **REQUEST CAMERA Button** | Permission request | Triggers camera permission | User-initiated |
| **REQUEST MIC Button** | Permission request | Triggers microphone permission | User-initiated |
| **REQUEST LOCATION Button** | Permission request | Triggers location permission | User-initiated |
| **GENERATE FULL REPORT** | Report generation | Creates summary report | User-initiated |

### Interactive Features

| Feature | Implementation | User Control | Notes |
|---------|----------------|-------------|-------|
| **Permission Status** | Color-coded indicators | Visual feedback | Red/Green status |
| **Desktop Notifications** | Browser notifications | Appears after permission | User must allow |
| **Synthetic Voice** | Speech synthesis | Verbal feedback | Welcome message |
| **Network Visualization** | Interactive connection map | Visual representation | Simulated data |
| **Risk Assessment** | Color-coded risk indicators | Visual representation | Risk categories |

## Data Collection Lifecycle

### 1. Pre-Consent Stage

- No data collection allowed
- Basic UI interaction only
- `appState.dataCollectionActive = false`
- No event listeners for tracking attached

### 2. Assessment Stage

- Progress tracking only
- No personal/browser data collection
- Simulated security assessment
- `appState.dataCollectionActive` still `false`
- Terminal-style progress visualization

### 3. Post-Consent Dashboard Stage

- `appState.dataCollectionActive` set to `true`
- Full data collection begins
- Real-time monitoring activated
- Permission requests enabled
- Interactive features unlocked

## Technical Implementation

### Main Control Flag Implementation

```javascript
// This is the critical control that prevents any data collection
// until the user reaches the dashboard after consent
appState.dataCollectionActive = false;

// All data collection methods check this flag before proceeding
function attemptDataCollection() {
    if (!appState.dataCollectionActive) {
        console.log('Data collection not active yet');
        return false;
    }
    return true;
}
```

### Event Listener Protection

```javascript
function handleMouseMove(e) {
    // Check if data collection is allowed before tracking
    if (!appState.dataCollectionActive) return;
    
    // If we get here, user has consented to data collection
    trackCursor(e);
}
```

### Permission Request Implementation

```javascript
async function requestCameraAccess() {
    // Verify data collection is active (post-consent)
    if (!appState.dataCollectionActive) {
        console.error('Cannot request camera before consent');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        updatePermissionStatus('camera', 'granted');
        // Handle successful permission
    } catch (err) {
        updatePermissionStatus('camera', 'denied');
        // Handle permission denial
    }
}
```

## Privacy Protection Summary

The OWL website implementation ensures strict user privacy protection through:

1. **Explicit Opt-In**: Requires checkbox confirmation and identifier input
2. **Multi-Stage Gates**: Three distinct screens before data collection begins
3. **Local-Only Processing**: All data remains in-browser with no external transmission
4. **Permission Transparency**: All permission-based features require explicit user action
5. **Visual Feedback**: Clear status indicators for all collected data
6. **Educational Purpose**: Demonstrating capabilities while raising privacy awareness

This comprehensive protection model ensures the educational demonstration respects user privacy while effectively showcasing modern web capabilities.

---

© 2023 Owl Advisory Group - Security Scanner Demo | *For educational purposes only*
