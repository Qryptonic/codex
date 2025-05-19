/**
 * Sensors & Permissions Module for Owl Security Scanner
 * Handles all permission requests and sensor access
 * Enhanced to handle maximum legal hardware access with proper permission flow
 */

'use strict';

// Import from config module
import { CONFIG, logger } from './config.js';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.sensorsPermissions = {};

// Track permission statuses
const permissionStatus = {
    geolocation: 'not-requested',
    camera: 'not-requested',
    microphone: 'not-requested',
    notifications: 'not-requested',
    deviceMotion: 'not-requested',
    deviceOrientation: 'not-requested',
    bluetooth: 'not-requested',
    usb: 'not-requested',
    serial: 'not-requested',
    hid: 'not-requested',
    midi: 'not-requested',
    clipboard: 'not-requested',
    nfc: 'not-requested',
    persistentStorage: 'not-requested',
    wakeLock: 'not-requested',
    accelerometer: 'not-requested',
    gyroscope: 'not-requested',
    magnetometer: 'not-requested',
    ambientLight: 'not-requested'
};

/**
 * Initialize the sensors & permissions module
 */
export function initSensorsPermissions() {
    logger.info('Initializing sensors & permissions module');
    
    // Initialize tracking of permission changes
    monitorPermissionChanges();
    
    // Check existing permissions
    checkExistingPermissions();
    
    return true;
}

/**
 * Monitor permission changes via the Permissions API (if available)
 */
function monitorPermissionChanges() {
    if ('permissions' in navigator) {
        logger.debug('Permissions API available, setting up permission change monitoring');
        
        // Define permission types to monitor
        const permissionNames = [
            'geolocation',
            'camera',
            'microphone',
            'notifications',
            'clipboard-read',
            'clipboard-write',
            'accelerometer',
            'gyroscope',
            'magnetometer'
        ];
        
        // Set up monitoring for each permission
        permissionNames.forEach(name => {
            try {
                navigator.permissions.query({ name })
                    .then(permResult => {
                        // Update initial status
                        updatePermissionStatus(name, permResult.state);
                        
                        // Set up change listener
                        permResult.addEventListener('change', () => {
                            updatePermissionStatus(name, permResult.state);
                        });
                    })
                    .catch(err => {
                        logger.warn(`Permission query not supported for ${name}:`, err);
                    });
            } catch (err) {
                logger.warn(`Error querying permission ${name}:`, err);
            }
        });
    } else {
        logger.warn('Permissions API not available, cannot monitor permission changes');
    }
}

/**
 * Check existing permissions using the Permissions API
 */
function checkExistingPermissions() {
    if ('permissions' in navigator) {
        // Define permissions to check
        const permissionNames = [
            'geolocation',
            'camera',
            'microphone',
            'notifications',
            'clipboard-read',
            'clipboard-write'
        ];
        
        // Check each permission
        permissionNames.forEach(name => {
            try {
                navigator.permissions.query({ name })
                    .then(permResult => {
                        updatePermissionStatus(name, permResult.state);
                    })
                    .catch(() => {
                        logger.debug(`Permission query not supported for ${name}`);
                    });
            } catch (err) {
                logger.debug(`Error querying permission ${name}:`, err);
            }
        });
    }
}

/**
 * Update permission status tracking
 * @param {string} name - The permission name
 * @param {string} state - The permission state ('granted', 'denied', 'prompt')
 */
function updatePermissionStatus(name, state) {
    // Map permission name to our tracking key
    let trackingKey = name;
    if (name === 'clipboard-read' || name === 'clipboard-write') {
        trackingKey = 'clipboard';
    }
    
    // Update permission status
    if (permissionStatus.hasOwnProperty(trackingKey)) {
        permissionStatus[trackingKey] = state;
        
        // Log significant changes
        if (state === 'granted' || state === 'denied') {
            logger.info(`Permission ${name} is now ${state}`);
        }
        
        // Update user profile if available
        if (window.userProfile && window.userProfile.permissions) {
            window.userProfile.permissions[trackingKey] = state;
        }
    }
    
    // Update UI if element exists
    const permElement = document.getElementById(`${trackingKey}-permission-value`);
    if (permElement) {
        permElement.textContent = state.toUpperCase();
        
        // Update classes
        permElement.classList.remove('severity-low', 'severity-medium', 'severity-high');
        if (state === 'granted') {
            permElement.classList.add('severity-high');
        } else if (state === 'denied') {
            permElement.classList.add('severity-low');
        } else {
            permElement.classList.add('severity-medium');
        }
    }
}

/**
 * Request access to geolocation
 * @returns {Promise<GeolocationPosition>} A promise that resolves to the position
 */
export async function requestGeolocation() {
    logger.debug('Requesting geolocation permission');
    
    if (!navigator.geolocation) {
        logger.warn('Geolocation API not supported');
        updatePermissionStatus('geolocation', 'not-supported');
        return Promise.reject(new Error('Geolocation not supported'));
    }
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
        
        // Update permission status on success
        updatePermissionStatus('geolocation', 'granted');
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.geolocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            };
        }
        
        return position;
    } catch (error) {
        // Update permission status on error
        if (error.code === 1) {
            updatePermissionStatus('geolocation', 'denied');
        } else {
            logger.error('Geolocation error:', error);
        }
        
        throw error;
    }
}

/**
 * Request access to camera
 * @returns {Promise<MediaStream>} A promise that resolves to the media stream
 */
export async function requestCamera() {
    logger.debug('Requesting camera permission');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logger.warn('Camera API not supported');
        updatePermissionStatus('camera', 'not-supported');
        return Promise.reject(new Error('Camera not supported'));
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Update permission status on success
        updatePermissionStatus('camera', 'granted');
        
        // Update user profile
        if (window.userProfile) {
            window.userProfile.permissions = window.userProfile.permissions || {};
            window.userProfile.permissions.camera = 'granted';
        }
        
        return stream;
    } catch (error) {
        // Update permission status on error
        if (error.name === 'NotAllowedError') {
            updatePermissionStatus('camera', 'denied');
        } else {
            logger.error('Camera access error:', error);
        }
        
        throw error;
    }
}

/**
 * Request access to microphone
 * @returns {Promise<MediaStream>} A promise that resolves to the media stream
 */
export async function requestMicrophone() {
    logger.debug('Requesting microphone permission');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logger.warn('Microphone API not supported');
        updatePermissionStatus('microphone', 'not-supported');
        return Promise.reject(new Error('Microphone not supported'));
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Update permission status on success
        updatePermissionStatus('microphone', 'granted');
        
        // Update user profile
        if (window.userProfile) {
            window.userProfile.permissions = window.userProfile.permissions || {};
            window.userProfile.permissions.microphone = 'granted';
        }
        
        return stream;
    } catch (error) {
        // Update permission status on error
        if (error.name === 'NotAllowedError') {
            updatePermissionStatus('microphone', 'denied');
        } else {
            logger.error('Microphone access error:', error);
        }
        
        throw error;
    }
}

/**
 * Request notification permission
 * @returns {Promise<string>} A promise that resolves to the permission state
 */
export async function requestNotifications() {
    logger.debug('Requesting notification permission');
    
    if (!('Notification' in window)) {
        logger.warn('Notification API not supported');
        updatePermissionStatus('notifications', 'not-supported');
        return Promise.reject(new Error('Notifications not supported'));
    }
    
    try {
        const permission = await Notification.requestPermission();
        
        // Update permission status
        updatePermissionStatus('notifications', permission);
        
        return permission;
    } catch (error) {
        logger.error('Notification permission error:', error);
        throw error;
    }
}

/**
 * Request device motion permission (required on iOS 13+)
 * @returns {Promise<string>} A promise that resolves to the permission state
 */
export async function requestDeviceMotion() {
    logger.debug('Requesting device motion permission');
    
    if (!window.DeviceMotionEvent) {
        logger.warn('Device Motion API not supported');
        updatePermissionStatus('deviceMotion', 'not-supported');
        return Promise.reject(new Error('Device Motion not supported'));
    }
    
    try {
        // Check if permission API is available (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const permission = await DeviceMotionEvent.requestPermission();
            updatePermissionStatus('deviceMotion', permission);
            return permission;
        } else {
            // No permission required
            updatePermissionStatus('deviceMotion', 'granted');
            return 'granted';
        }
    } catch (error) {
        logger.error('Device motion permission error:', error);
        updatePermissionStatus('deviceMotion', 'denied');
        throw error;
    }
}

/**
 * Request device orientation permission (required on iOS 13+)
 * @returns {Promise<string>} A promise that resolves to the permission state
 */
export async function requestDeviceOrientation() {
    logger.debug('Requesting device orientation permission');
    
    if (!window.DeviceOrientationEvent) {
        logger.warn('Device Orientation API not supported');
        updatePermissionStatus('deviceOrientation', 'not-supported');
        return Promise.reject(new Error('Device Orientation not supported'));
    }
    
    try {
        // Check if permission API is available (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            updatePermissionStatus('deviceOrientation', permission);
            return permission;
        } else {
            // No permission required
            updatePermissionStatus('deviceOrientation', 'granted');
            return 'granted';
        }
    } catch (error) {
        logger.error('Device orientation permission error:', error);
        updatePermissionStatus('deviceOrientation', 'denied');
        throw error;
    }
}

/**
 * Request bluetooth permission
 * @returns {Promise<BluetoothDevice>} A promise that resolves to the selected device
 */
export async function requestBluetooth() {
    logger.debug('Requesting Bluetooth permission');
    
    if (!navigator.bluetooth) {
        logger.warn('Bluetooth API not supported');
        updatePermissionStatus('bluetooth', 'not-supported');
        return Promise.reject(new Error('Bluetooth not supported'));
    }
    
    try {
        // Request a device to trigger the permission prompt
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        });
        
        updatePermissionStatus('bluetooth', 'granted');
        
        return device;
    } catch (error) {
        // Don't treat user cancellation as error
        if (error.name === 'NotFoundError') {
            logger.debug('User cancelled Bluetooth device selection');
            return null;
        }
        
        logger.error('Bluetooth permission error:', error);
        updatePermissionStatus('bluetooth', 'denied');
        throw error;
    }
}

/**
 * Request USB permission
 * @returns {Promise<USBDevice>} A promise that resolves to the selected device
 */
export async function requestUSB() {
    logger.debug('Requesting USB permission');
    
    if (!navigator.usb) {
        logger.warn('USB API not supported');
        updatePermissionStatus('usb', 'not-supported');
        return Promise.reject(new Error('USB not supported'));
    }
    
    try {
        // Request a device to trigger the permission prompt
        const device = await navigator.usb.requestDevice({
            filters: [] // Empty filters to show all devices
        });
        
        updatePermissionStatus('usb', 'granted');
        
        return device;
    } catch (error) {
        // Don't treat user cancellation as error
        if (error.name === 'NotFoundError') {
            logger.debug('User cancelled USB device selection');
            return null;
        }
        
        logger.error('USB permission error:', error);
        updatePermissionStatus('usb', 'denied');
        throw error;
    }
}

/**
 * Request serial port permission
 * @returns {Promise<SerialPort>} A promise that resolves to the selected port
 */
export async function requestSerial() {
    logger.debug('Requesting Serial permission');
    
    if (!navigator.serial) {
        logger.warn('Serial API not supported');
        updatePermissionStatus('serial', 'not-supported');
        return Promise.reject(new Error('Serial not supported'));
    }
    
    try {
        // Request a port to trigger the permission prompt
        const port = await navigator.serial.requestPort();
        
        updatePermissionStatus('serial', 'granted');
        
        return port;
    } catch (error) {
        // Don't treat user cancellation as error
        if (error.name === 'NotFoundError') {
            logger.debug('User cancelled Serial port selection');
            return null;
        }
        
        logger.error('Serial permission error:', error);
        updatePermissionStatus('serial', 'denied');
        throw error;
    }
}

/**
 * Request HID device permission
 * @returns {Promise<HIDDevice>} A promise that resolves to the selected device
 */
export async function requestHID() {
    logger.debug('Requesting HID permission');
    
    if (!navigator.hid) {
        logger.warn('HID API not supported');
        updatePermissionStatus('hid', 'not-supported');
        return Promise.reject(new Error('HID not supported'));
    }
    
    try {
        // Request a device to trigger the permission prompt
        const devices = await navigator.hid.requestDevice({
            filters: [] // Empty filters to show all devices
        });
        
        updatePermissionStatus('hid', 'granted');
        
        return devices.length > 0 ? devices[0] : null;
    } catch (error) {
        // Don't treat user cancellation as error
        if (error.name === 'NotFoundError') {
            logger.debug('User cancelled HID device selection');
            return null;
        }
        
        logger.error('HID permission error:', error);
        updatePermissionStatus('hid', 'denied');
        throw error;
    }
}

/**
 * Request MIDI access
 * @returns {Promise<MIDIAccess>} A promise that resolves to MIDI access
 */
export async function requestMIDI() {
    logger.debug('Requesting MIDI permission');
    
    if (!navigator.requestMIDIAccess) {
        logger.warn('MIDI API not supported');
        updatePermissionStatus('midi', 'not-supported');
        return Promise.reject(new Error('MIDI not supported'));
    }
    
    try {
        // Request MIDI access
        const midiAccess = await navigator.requestMIDIAccess({
            sysex: true // Request system exclusive message permission
        });
        
        updatePermissionStatus('midi', 'granted');
        
        return midiAccess;
    } catch (error) {
        logger.error('MIDI permission error:', error);
        updatePermissionStatus('midi', 'denied');
        throw error;
    }
}

/**
 * Request clipboard read permission
 * @returns {Promise<string>} A promise that resolves to the clipboard text
 */
export async function requestClipboardRead() {
    logger.debug('Requesting clipboard read permission');
    
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        logger.warn('Clipboard read API not supported');
        updatePermissionStatus('clipboard', 'not-supported');
        return Promise.reject(new Error('Clipboard read not supported'));
    }
    
    try {
        // Attempt to read from clipboard (triggers permission)
        const text = await navigator.clipboard.readText();
        
        updatePermissionStatus('clipboard', 'granted');
        
        return text;
    } catch (error) {
        logger.error('Clipboard read permission error:', error);
        updatePermissionStatus('clipboard', 'denied');
        throw error;
    }
}

/**
 * Request persistent storage permission
 * @returns {Promise<boolean>} A promise that resolves to whether persistence was granted
 */
export async function requestPersistentStorage() {
    logger.debug('Requesting persistent storage permission');
    
    if (!navigator.storage || !navigator.storage.persist) {
        logger.warn('Persistent Storage API not supported');
        updatePermissionStatus('persistentStorage', 'not-supported');
        return Promise.reject(new Error('Persistent storage not supported'));
    }
    
    try {
        // Request persistence
        const isPersisted = await navigator.storage.persist();
        
        updatePermissionStatus('persistentStorage', isPersisted ? 'granted' : 'denied');
        
        return isPersisted;
    } catch (error) {
        logger.error('Persistent storage permission error:', error);
        updatePermissionStatus('persistentStorage', 'denied');
        throw error;
    }
}

/**
 * Request NFC access
 * @returns {Promise<NDEFReader>} A promise that resolves to the NFC reader
 */
export async function requestNFC() {
    logger.debug('Requesting NFC permission');
    
    if (!('NDEFReader' in window)) {
        logger.warn('NFC API not supported');
        updatePermissionStatus('nfc', 'not-supported');
        return Promise.reject(new Error('NFC not supported'));
    }
    
    try {
        // Create reader and try to scan (triggers permission)
        const reader = new NDEFReader();
        await reader.scan();
        
        updatePermissionStatus('nfc', 'granted');
        
        return reader;
    } catch (error) {
        logger.error('NFC permission error:', error);
        updatePermissionStatus('nfc', 'denied');
        throw error;
    }
}

/**
 * Request wake lock
 * @returns {Promise<WakeLockSentinel>} A promise that resolves to the wake lock sentinel
 */
export async function requestWakeLock() {
    logger.debug('Requesting wake lock permission');
    
    if (!navigator.wakeLock || !navigator.wakeLock.request) {
        logger.warn('Wake Lock API not supported');
        updatePermissionStatus('wakeLock', 'not-supported');
        return Promise.reject(new Error('Wake lock not supported'));
    }
    
    try {
        // Request wake lock
        const wakeLock = await navigator.wakeLock.request('screen');
        
        updatePermissionStatus('wakeLock', 'granted');
        
        return wakeLock;
    } catch (error) {
        logger.error('Wake lock permission error:', error);
        updatePermissionStatus('wakeLock', 'denied');
        throw error;
    }
}

/**
 * Request web share
 * @param {Object} data - The data to share
 * @returns {Promise<void>} A promise that resolves when sharing is complete
 */
export async function requestWebShare(data = { title: 'Owl Security', text: 'Check out this browser security demo', url: window.location.href }) {
    logger.debug('Requesting web share permission');
    
    if (!navigator.share) {
        logger.warn('Web Share API not supported');
        return Promise.reject(new Error('Web share not supported'));
    }
    
    try {
        // Attempt to share
        await navigator.share(data);
        logger.info('Content shared successfully');
        return true;
    } catch (error) {
        // Don't treat user cancellation as error
        if (error.name === 'AbortError') {
            logger.debug('User cancelled sharing');
            return false;
        }
        
        logger.error('Web share error:', error);
        throw error;
    }
}

/**
 * Listen for and handle device motion events
 * @param {Function} callback - The callback to call with motion data
 */
export function handleDeviceMotion(callback) {
    if (!window.DeviceMotionEvent) {
        logger.warn('Device Motion API not supported');
        return false;
    }
    
    // Add event listener
    window.addEventListener('devicemotion', callback);
    
    return true;
}

/**
 * Listen for and handle device orientation events
 * @param {Function} callback - The callback to call with orientation data
 */
export function handleDeviceOrientation(callback) {
    if (!window.DeviceOrientationEvent) {
        logger.warn('Device Orientation API not supported');
        return false;
    }
    
    // Add event listener
    window.addEventListener('deviceorientation', callback);
    
    return true;
}

/**
 * Generate permission report for diagnostic purposes
 * @returns {Object} The permission report
 */
export function generatePermissionReport() {
    // Create report object
    const report = {
        timestamp: new Date().toISOString(),
        permissions: { ...permissionStatus },
        supported: {}
    };
    
    // Check API support
    report.supported = {
        geolocation: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        notifications: 'Notification' in window,
        deviceMotion: 'DeviceMotionEvent' in window,
        deviceOrientation: 'DeviceOrientationEvent' in window,
        bluetooth: 'bluetooth' in navigator,
        usb: 'usb' in navigator,
        serial: 'serial' in navigator,
        hid: 'hid' in navigator,
        midi: 'requestMIDIAccess' in navigator,
        clipboard: 'clipboard' in navigator && 'readText' in navigator.clipboard,
        nfc: 'NDEFReader' in window,
        persistentStorage: 'storage' in navigator && 'persist' in navigator.storage,
        wakeLock: 'wakeLock' in navigator && 'request' in navigator.wakeLock
    };
    
    logger.debug('Generated permission report', report);
    
    return report;
}

// Export module functions
window.modules.sensorsPermissions = {
    initSensorsPermissions,
    requestGeolocation,
    requestCamera,
    requestMicrophone,
    requestNotifications,
    requestDeviceMotion,
    requestDeviceOrientation,
    requestBluetooth,
    requestUSB,
    requestSerial,
    requestHID,
    requestMIDI,
    requestClipboardRead,
    requestPersistentStorage,
    requestNFC,
    requestWakeLock,
    requestWebShare,
    handleDeviceMotion,
    handleDeviceOrientation,
    generatePermissionReport,
    permissionStatus
};

// Also expose globally for direct access
window.requestGeolocation = requestGeolocation;
window.requestCamera = requestCamera;
window.requestMicrophone = requestMicrophone;
window.requestNotifications = requestNotifications;
window.requestDeviceMotion = requestDeviceMotion;
window.requestDeviceOrientation = requestDeviceOrientation;
window.requestBluetooth = requestBluetooth;
window.requestUSB = requestUSB;
window.requestSerial = requestSerial;
window.requestHID = requestHID;
window.requestMIDI = requestMIDI;
window.requestPersistentStorage = requestPersistentStorage;
window.requestWebShare = requestWebShare;

// Initialize module
logger.info('Sensors & Permissions module loaded - Enhanced hardware monitoring capabilities');