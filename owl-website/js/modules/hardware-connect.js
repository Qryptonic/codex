/**
 * Hardware Connect Module - Advanced Hardware Interface
 * Collects maximum legal hardware information using modern browser APIs
 * All collection requires user consent via "checkbox acknowledgement"
 */

'use strict';

// Import necessary modules
import { CONFIG, logger } from './config.js';
import { dataCollectionHash } from './core.js';

// Create a modules namespace
window.modules = window.modules || {};
window.modules.hardwareConnect = {};

// Track which permissions have been granted
const permissionStatus = {
    deviceOrientation: false,
    deviceMotion: false,
    geolocation: false,
    microphone: false,
    camera: false,
    bluetooth: false,
    usb: false,
    serial: false,
    hid: false,
    midi: false
};

/**
 * Initialize hardware connection and monitoring
 * This is the main entry point for hardware data collection
 */
export async function initializeHardwareConnect() {
    logger.info('Initializing advanced hardware connect module');
    
    try {
        // Create or update the hardware profile in user profile
        if (window.userProfile) {
            window.userProfile.hardwareProfile = window.userProfile.hardwareProfile || {};
            window.userProfile.hardwareProfile.advancedMonitoring = {
                initialized: Date.now(),
                permissionStatus: { ...permissionStatus }
            };
        }
        
        // Add hardware connect panel to the UI if it doesn't exist
        createHardwareConnectPanel();
        
        // Initialize basic sensors that don't require permissions
        initializeBasicSensors();
        
        return true;
    } catch (error) {
        logger.error('Error initializing hardware connect module:', error);
        if (window.logEnterpriseError) {
            window.logEnterpriseError('Hardware connect initialization failed: ' + error.message, 'high', 'HARDWARE-CONNECT');
        }
        return false;
    }
}

/**
 * Create hardware connect panel in the UI
 */
function createHardwareConnectPanel() {
    // Check if the panel already exists
    if (document.getElementById('hardware-connect-panel')) {
        return;
    }
    
    // Find the container where we'll add the hardware panel
    const container = document.querySelector('.dashboard-panels') || document.querySelector('main');
    if (!container) {
        logger.warn('Unable to find container for hardware connect panel');
        return;
    }
    
    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'hardware-connect-panel';
    panel.className = 'panel';
    panel.innerHTML = `
        <h2>HARDWARE INTERFACE</h2>
        <div class="corner-br"></div>
        
        <div class="info-container">
            <div class="hardware-connect-controls">
                <h3>Device Sensors & Hardware</h3>
                <p class="sensor-description">Grant access to monitor device hardware capabilities and sensor data.</p>
                <div class="permission-buttons">
                    <button id="motion-sensor-btn" class="action-button permission-btn">Motion Sensors</button>
                    <button id="orientation-sensor-btn" class="action-button permission-btn">Orientation</button>
                    <button id="geolocation-btn" class="action-button permission-btn">Geolocation</button>
                    <button id="media-devices-btn" class="action-button permission-btn">Media Devices</button>
                </div>
                
                <h3>Advanced Hardware Interfaces</h3>
                <p class="sensor-description">Connect to peripheral hardware for enhanced monitoring.</p>
                <div class="permission-buttons">
                    <button id="bluetooth-btn" class="action-button permission-btn">Bluetooth</button>
                    <button id="usb-btn" class="action-button permission-btn">USB</button>
                    <button id="serial-btn" class="action-button permission-btn">Serial</button>
                    <button id="hid-btn" class="action-button permission-btn">HID</button>
                    <button id="midi-btn" class="action-button permission-btn">MIDI</button>
                </div>
            </div>
            
            <div class="sensor-readouts">
                <h3>Sensor Readings</h3>
                <div class="info-item">
                    <div class="info-label">Motion</div>
                    <div id="motion-value" class="info-value loading">NOT AVAILABLE</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Orientation</div>
                    <div id="orientation-value" class="info-value loading">NOT AVAILABLE</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Position</div>
                    <div id="position-value" class="info-value loading">NOT AVAILABLE</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Media Devices</div>
                    <div id="media-devices-value" class="info-value loading">NOT AVAILABLE</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Connected Devices</div>
                    <div id="connected-devices-value" class="info-value loading">NONE</div>
                </div>
                
                <h3>Network Information</h3>
                <div class="info-item">
                    <div class="info-label">Connection Type</div>
                    <div id="connection-type-value" class="info-value loading">CHECKING...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Effective Speed</div>
                    <div id="connection-speed-value" class="info-value loading">CHECKING...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Data Saver</div>
                    <div id="data-saver-value" class="info-value loading">CHECKING...</div>
                </div>
            </div>
        </div>
    `;
    
    // Add the panel to the container
    container.appendChild(panel);
    
    // Add event listeners for permission buttons
    setupPermissionButtonListeners();
    
    // Initialize network information
    updateNetworkInformation();
}

/**
 * Set up event listeners for permission buttons
 */
function setupPermissionButtonListeners() {
    // Motion Sensors
    document.getElementById('motion-sensor-btn')?.addEventListener('click', async () => {
        try {
            // Check if DeviceMotionEvent requires permission
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    permissionStatus.deviceMotion = true;
                    startMotionTracking();
                    updateButtonState('motion-sensor-btn', true);
                } else {
                    updateButtonState('motion-sensor-btn', false, 'DENIED');
                }
            } else {
                // No permission needed, automatically start
                permissionStatus.deviceMotion = true;
                startMotionTracking();
                updateButtonState('motion-sensor-btn', true);
            }
        } catch (error) {
            logger.error('Error requesting motion sensor permission:', error);
            updateButtonState('motion-sensor-btn', false, 'ERROR');
        }
    });
    
    // Orientation Sensors
    document.getElementById('orientation-sensor-btn')?.addEventListener('click', async () => {
        try {
            // Check if DeviceOrientationEvent requires permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    permissionStatus.deviceOrientation = true;
                    startOrientationTracking();
                    updateButtonState('orientation-sensor-btn', true);
                } else {
                    updateButtonState('orientation-sensor-btn', false, 'DENIED');
                }
            } else {
                // No permission needed, automatically start
                permissionStatus.deviceOrientation = true;
                startOrientationTracking();
                updateButtonState('orientation-sensor-btn', true);
            }
        } catch (error) {
            logger.error('Error requesting orientation sensor permission:', error);
            updateButtonState('orientation-sensor-btn', false, 'ERROR');
        }
    });
    
    // Geolocation
    document.getElementById('geolocation-btn')?.addEventListener('click', async () => {
        try {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        permissionStatus.geolocation = true;
                        updateGeolocationInfo(position);
                        updateButtonState('geolocation-btn', true);
                        
                        // Start watching position
                        startGeolocationWatching();
                    },
                    (error) => {
                        logger.error('Geolocation permission denied:', error);
                        updateButtonState('geolocation-btn', false, 'DENIED');
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                updateButtonState('geolocation-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            logger.error('Error requesting geolocation permission:', error);
            updateButtonState('geolocation-btn', false, 'ERROR');
        }
    });
    
    // Media Devices
    document.getElementById('media-devices-btn')?.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            permissionStatus.microphone = true;
            permissionStatus.camera = true;
            
            // Stop the stream right away - we just want the permission
            stream.getTracks().forEach(track => track.stop());
            
            // Get device info
            enumerateMediaDevices();
            updateButtonState('media-devices-btn', true);
        } catch (error) {
            logger.error('Error requesting media devices permission:', error);
            updateButtonState('media-devices-btn', false, 'DENIED');
        }
    });
    
    // Bluetooth
    document.getElementById('bluetooth-btn')?.addEventListener('click', async () => {
        try {
            if ('bluetooth' in navigator) {
                // Request a device to trigger permission prompt
                await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
                permissionStatus.bluetooth = true;
                updateButtonState('bluetooth-btn', true);
                updateConnectedDevices('Bluetooth permission granted');
            } else {
                updateButtonState('bluetooth-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') { // NotFoundError is when user cancels
                logger.error('Error requesting Bluetooth permission:', error);
                updateButtonState('bluetooth-btn', false, 'ERROR');
            } else {
                updateButtonState('bluetooth-btn', false, 'CANCELLED');
            }
        }
    });
    
    // USB
    document.getElementById('usb-btn')?.addEventListener('click', async () => {
        try {
            if ('usb' in navigator) {
                // Request a device to trigger permission prompt
                await navigator.usb.requestDevice({ filters: [] });
                permissionStatus.usb = true;
                updateButtonState('usb-btn', true);
                updateConnectedDevices('USB permission granted');
            } else {
                updateButtonState('usb-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') { // NotFoundError is when user cancels
                logger.error('Error requesting USB permission:', error);
                updateButtonState('usb-btn', false, 'ERROR');
            } else {
                updateButtonState('usb-btn', false, 'CANCELLED');
            }
        }
    });
    
    // Serial
    document.getElementById('serial-btn')?.addEventListener('click', async () => {
        try {
            if ('serial' in navigator) {
                // Request a port to trigger permission prompt
                await navigator.serial.requestPort();
                permissionStatus.serial = true;
                updateButtonState('serial-btn', true);
                updateConnectedDevices('Serial permission granted');
            } else {
                updateButtonState('serial-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') { // NotFoundError is when user cancels
                logger.error('Error requesting Serial permission:', error);
                updateButtonState('serial-btn', false, 'ERROR');
            } else {
                updateButtonState('serial-btn', false, 'CANCELLED');
            }
        }
    });
    
    // HID
    document.getElementById('hid-btn')?.addEventListener('click', async () => {
        try {
            if ('hid' in navigator) {
                // Request a device to trigger permission prompt
                await navigator.hid.requestDevice({ filters: [] });
                permissionStatus.hid = true;
                updateButtonState('hid-btn', true);
                updateConnectedDevices('HID permission granted');
            } else {
                updateButtonState('hid-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') { // NotFoundError is when user cancels
                logger.error('Error requesting HID permission:', error);
                updateButtonState('hid-btn', false, 'ERROR');
            } else {
                updateButtonState('hid-btn', false, 'CANCELLED');
            }
        }
    });
    
    // MIDI
    document.getElementById('midi-btn')?.addEventListener('click', async () => {
        try {
            if ('requestMIDIAccess' in navigator) {
                const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
                permissionStatus.midi = true;
                updateButtonState('midi-btn', true);
                updateConnectedDevices('MIDI permission granted');
            } else {
                updateButtonState('midi-btn', false, 'UNSUPPORTED');
            }
        } catch (error) {
            logger.error('Error requesting MIDI permission:', error);
            updateButtonState('midi-btn', false, 'ERROR');
        }
    });
}

/**
 * Update button state after permission attempt
 */
function updateButtonState(buttonId, granted, deniedReason = 'DENIED') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (granted) {
        button.textContent = 'GRANTED';
        button.style.backgroundColor = 'var(--severity-low)';
        button.style.borderColor = 'var(--severity-low)';
        button.disabled = true;
    } else {
        button.textContent = deniedReason;
        button.style.backgroundColor = 'var(--severity-high)';
        button.style.borderColor = 'var(--severity-high)';
        
        // Allow retrying after a delay
        setTimeout(() => {
            const originalText = buttonId.replace('-btn', '').split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            button.textContent = originalText;
            button.disabled = false;
            button.style.backgroundColor = '';
            button.style.borderColor = '';
        }, 5000);
    }
}

/**
 * Initialize sensors that don't require explicit permissions
 */
function initializeBasicSensors() {
    // Network Information
    updateNetworkInformation();
    
    // Try automatic motion and orientation tracking if supported
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission !== 'function') {
        startMotionTracking();
    }
    
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission !== 'function') {
        startOrientationTracking();
    }
    
    // Set up connection change listeners
    if ('connection' in navigator && navigator.connection) {
        navigator.connection.addEventListener('change', updateNetworkInformation);
    }
}

/**
 * Start tracking device motion
 */
function startMotionTracking() {
    const motionValue = document.getElementById('motion-value');
    if (!motionValue) return;
    
    // If we've already started, don't add a duplicate handler
    if (window.deviceMotionHandler) return;
    
    // Set initial value
    motionValue.textContent = 'MONITORING...';
    motionValue.classList.remove('loading');
    
    // Create motion handler
    window.deviceMotionHandler = function(event) {
        const { accelerationIncludingGravity, rotationRate } = event;
        
        if (!accelerationIncludingGravity) {
            motionValue.textContent = 'NO DATA';
            return;
        }
        
        // Format acceleration values
        const accel = {
            x: accelerationIncludingGravity.x?.toFixed(2) || 'N/A',
            y: accelerationIncludingGravity.y?.toFixed(2) || 'N/A',
            z: accelerationIncludingGravity.z?.toFixed(2) || 'N/A'
        };
        
        // Format rotation values if available
        const rotation = rotationRate ? {
            alpha: rotationRate.alpha?.toFixed(2) || 'N/A',
            beta: rotationRate.beta?.toFixed(2) || 'N/A',
            gamma: rotationRate.gamma?.toFixed(2) || 'N/A'
        } : null;
        
        // Update display
        motionValue.textContent = `A: ${accel.x}, ${accel.y}, ${accel.z}`;
        
        // Store in user profile
        if (window.userProfile?.hardwareProfile) {
            window.userProfile.hardwareProfile.motion = {
                acceleration: accel,
                rotation: rotation,
                timestamp: Date.now()
            };
        }
    };
    
    // Add event listener
    window.addEventListener('devicemotion', window.deviceMotionHandler);
}

/**
 * Start tracking device orientation
 */
function startOrientationTracking() {
    const orientationValue = document.getElementById('orientation-value');
    if (!orientationValue) return;
    
    // If we've already started, don't add a duplicate handler
    if (window.deviceOrientationHandler) return;
    
    // Set initial value
    orientationValue.textContent = 'MONITORING...';
    orientationValue.classList.remove('loading');
    
    // Create orientation handler
    window.deviceOrientationHandler = function(event) {
        const { alpha, beta, gamma, absolute } = event;
        
        if (alpha === null && beta === null && gamma === null) {
            orientationValue.textContent = 'NO DATA';
            return;
        }
        
        // Format orientation values
        const orientation = {
            alpha: alpha?.toFixed(2) || 'N/A',
            beta: beta?.toFixed(2) || 'N/A',
            gamma: gamma?.toFixed(2) || 'N/A'
        };
        
        // Update display
        orientationValue.textContent = `α: ${orientation.alpha}°, β: ${orientation.beta}°, γ: ${orientation.gamma}°`;
        
        // Store in user profile
        if (window.userProfile?.hardwareProfile) {
            window.userProfile.hardwareProfile.orientation = {
                alpha: alpha,
                beta: beta,
                gamma: gamma,
                absolute: absolute,
                timestamp: Date.now()
            };
        }
    };
    
    // Add event listener
    window.addEventListener('deviceorientation', window.deviceOrientationHandler);
}

/**
 * Start watching geolocation
 */
function startGeolocationWatching() {
    // If we've already started, don't track again
    if (window.geolocationWatchId) return;
    
    // Start watching position
    window.geolocationWatchId = navigator.geolocation.watchPosition(
        updateGeolocationInfo,
        (error) => {
            logger.error('Geolocation watching error:', error);
            const positionValue = document.getElementById('position-value');
            if (positionValue) {
                positionValue.textContent = 'ERROR: ' + error.message;
            }
        },
        { 
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        }
    );
}

/**
 * Update geolocation information
 */
function updateGeolocationInfo(position) {
    const positionValue = document.getElementById('position-value');
    if (!positionValue) return;
    
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    
    // Format position for display
    positionValue.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
    positionValue.classList.remove('loading');
    
    // Store in user profile
    if (window.userProfile?.hardwareProfile) {
        window.userProfile.hardwareProfile.geolocation = {
            latitude,
            longitude,
            accuracy,
            altitude: altitude !== null ? altitude : undefined,
            heading: heading !== null ? heading : undefined,
            speed: speed !== null ? speed : undefined,
            timestamp: position.timestamp
        };
    }
}

/**
 * Enumerate available media devices
 */
async function enumerateMediaDevices() {
    const mediaDevicesValue = document.getElementById('media-devices-value');
    if (!mediaDevicesValue) return;
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Count devices by type
        const counts = devices.reduce((acc, device) => {
            acc[device.kind] = (acc[device.kind] || 0) + 1;
            return acc;
        }, {});
        
        // Format for display
        const displayText = Object.entries(counts)
            .map(([kind, count]) => `${count} ${kind.replace('input', '').replace('output', '')}`)
            .join(', ');
        
        mediaDevicesValue.textContent = displayText || 'NONE DETECTED';
        mediaDevicesValue.classList.remove('loading');
        
        // Store in user profile
        if (window.userProfile?.hardwareProfile) {
            window.userProfile.hardwareProfile.mediaDevices = {
                counts,
                // Don't store full device details for privacy
                types: devices.map(device => device.kind),
                timestamp: Date.now()
            };
        }
    } catch (error) {
        logger.error('Error enumerating media devices:', error);
        mediaDevicesValue.textContent = 'ENUMERATION ERROR';
    }
}

/**
 * Update connected devices information
 */
function updateConnectedDevices(statusText) {
    const connectedDevicesValue = document.getElementById('connected-devices-value');
    if (!connectedDevicesValue) return;
    
    connectedDevicesValue.textContent = statusText || 'NONE';
    connectedDevicesValue.classList.remove('loading');
    
    // Count granted permissions
    const permissionCount = Object.values(permissionStatus).filter(Boolean).length;
    
    // Update the global hardware profile
    if (window.userProfile?.hardwareProfile) {
        window.userProfile.hardwareProfile.permissionStatus = { ...permissionStatus };
        window.userProfile.hardwareProfile.permissionCount = permissionCount;
    }
}

/**
 * Update network information
 */
function updateNetworkInformation() {
    const connectionTypeValue = document.getElementById('connection-type-value');
    const connectionSpeedValue = document.getElementById('connection-speed-value');
    const dataSaverValue = document.getElementById('data-saver-value');
    
    if (!connectionTypeValue || !connectionSpeedValue || !dataSaverValue) return;
    
    // Check if Network Information API is available
    if ('connection' in navigator && navigator.connection) {
        const connection = navigator.connection;
        
        // Connection type
        connectionTypeValue.textContent = connection.effectiveType || connection.type || 'UNKNOWN';
        connectionTypeValue.classList.remove('loading');
        
        // Connection speed
        if (connection.downlink) {
            connectionSpeedValue.textContent = `${connection.downlink} Mbps, RTT: ${connection.rtt || 'N/A'} ms`;
        } else {
            connectionSpeedValue.textContent = 'NOT AVAILABLE';
        }
        connectionSpeedValue.classList.remove('loading');
        
        // Data saver mode
        dataSaverValue.textContent = connection.saveData ? 'ENABLED' : 'DISABLED';
        dataSaverValue.classList.remove('loading');
        
        // Store in user profile
        if (window.userProfile?.hardwareProfile) {
            window.userProfile.hardwareProfile.network = {
                type: connection.effectiveType || connection.type,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                timestamp: Date.now()
            };
        }
    } else {
        // API not available
        connectionTypeValue.textContent = 'API N/A';
        connectionSpeedValue.textContent = 'API N/A';
        dataSaverValue.textContent = 'API N/A';
        
        connectionTypeValue.classList.remove('loading');
        connectionSpeedValue.classList.remove('loading');
        dataSaverValue.classList.remove('loading');
    }
}

// Export all functions for module interface
window.modules.hardwareConnect = {
    initializeHardwareConnect,
    startMotionTracking,
    startOrientationTracking,
    startGeolocationWatching,
    enumerateMediaDevices,
    updateNetworkInformation,
    permissionStatus
};

// Also make functions available globally for direct access
window.initializeHardwareConnect = initializeHardwareConnect;

// Log that the module has loaded
logger.info('Hardware Connect module initialized - Enhanced hardware monitoring capabilities loaded');