// js/config.js

'use strict';

// --- Configuration ---
const CONFIG = {
    MAX_KEYSTROKE_LINES: 8,
    WEBRTC_TIMEOUT: 5000,
    CURSOR_DATA_LIMIT: 40,
    SCROLL_DATA_LIMIT: 30,
    MOUSE_THROTTLE_MS: 120,
    SCROLL_THROTTLE_MS: 180,
    CAMERA_PREVIEW_DURATION: 4000,
    MIC_ACTIVE_DURATION: 4000,
    SANITIZE_KEYSTROKES: false, // Set to true to replace keys with '*' in log
    LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error' - Changed to debug for troubleshooting
    NETWORK_MAP_REFRESH_MS: 12000,
    NOISE_ANALYSIS_INTERVAL: 5000,
    SPEED_TEST_SIZE: 1000000, // 1MB for speed test (placeholder, simple test used)
    FONT_TEST_LIMIT: 50, // Max fonts to list individually
    BENCHMARK_ITERATIONS: 1000000,
    UPDATE_INTERVAL_MS: 1000, // Interval for updating time-based elements

    // Additional Configuration for Stability
    ENABLE_ERROR_RECOVERY: true, // Enable automatic error recovery
    DEFER_INTENSIVE_TASKS: true, // Defer intensive tasks to improve UI responsiveness
    HOVER_THROTTLE_MS: 200, // Throttle hover events more aggressively
};

// --- Logger ---
const logger = {
    debug: (...args) => {
        if (CONFIG.LOG_LEVEL === 'debug') console.debug('[DBG]', ...args);
    },
    info: (...args) => {
        if (['debug', 'info'].includes(CONFIG.LOG_LEVEL)) console.info('[INF]', ...args);
    },
    warn: (...args) => {
        if (['debug', 'info', 'warn'].includes(CONFIG.LOG_LEVEL)) console.warn('[WRN]', ...args);
    },
    error: (...args) => {
        console.error('[ERR]', ...args);
    },
};

// --- DOM Element Cache ---
const DOMElements = {};
const elementIds = [
    // Terms Screen
    'termsCheckbox',
    'termsButton',
    'userIdentity',
    'termsScreen',
    // Screens & Sections
    'dashboardScreen',
    'contact-section',
    'contact-form',
    'contact-confirmation',
    'https-warning',
    // Missing Elements
    'motion-value',
    'noise-level',
    // Contact Form
    'contactEmail',
    'primaryConcern',
    'submitContactBtn',
    'backToDashBtn',
    'contactBtn',
    // Dashboard Panels & Values
    'username-value',
    'session-id-value',
    'ip-value',
    'local-ip-value',
    'location-value',
    'location-status-note',
    'locationBtn',
    'local-time-value',
    'timezone-value',
    'language-value',
    'languages-value',
    'connection-value',
    'bandwidth-value',
    'latency-value',
    'connections-value',
    'network-map',
    'download-speed',
    'upload-speed',
    'device-type-value',
    'os-value',
    'cpu-value',
    'memory-value',
    'screen-value',
    'viewport-value',
    'screen-caps-value',
    'battery-text',
    'battery-fill',
    'motion-value',
    'battery-rate',
    'gpu-value',
    'js-performance',
    'cursor-position',
    'movement-pattern',
    'scroll-depth',
    'time-on-page',
    'typing-speed',
    'typing-dynamics',
    'clipboard-value',
    'touch-patterns',
    'keystrokeAnalysis',
    'browser-value',
    'useragent-value',
    'cookies-value',
    'dnt-value',
    'plugins-value',
    'storage-value',
    'codecs-value',
    'fingerprint-value',
    'canvas-value',
    'audio-value',
    'webgl-value',
    'camera-value',
    'camera-status-note',
    'cameraBtn',
    'video-preview',
    'microphone-value',
    'mic-status-note',
    'micBtn',
    'mic-activity',
    'permission-score',
    'privacy-score',
    'tracking-score',
    'identity-score',
    'leakage-score',
    'browser-security',
    'exposed-data',
    'trackers-value',
    // Advanced Profiling
    'noise-level',
    'speech-text',
    'speechBtn',
    'speech-status-note',
    'motion-patterns',
    'light-level',
    'bluetooth-devices',
    'bluetoothBtn',
    'bluetooth-status-note',
    'fonts-value',
    'form-interaction',
    'tab-visibility',
    'storage-details',
    // Identity Summary Elements
    'exposure-summary',
    'summary-location',
    'summary-device',
    'summary-uniqueness',
    'summary-persistence',
    // --- New Element IDs (Added for 100/100 Demo) ---
    // Granular FP
    'svg-fp-value',
    'locale-fp-value',
    // File System
    'file-meta-value',
    'analyzeFileBtn',
    'file-meta-status-note',
    'save-file-value',
    'saveFileBtn',
    'save-file-status-note',
    // Hardware Connect
    'usb-device-value',
    'connectUsbBtn',
    'usb-device-status-note',
    'hid-device-value',
    'connectHidBtn',
    'hid-device-status-note',
    'serial-device-value',
    'connectSerialBtn',
    'serial-device-status-note',
    // Background & State
    'push-alert-value',
    'enablePushBtn',
    'push-alert-status-note',
    'bg-sync-value',
    'queueSyncBtn',
    'bg-sync-status-note',
    'idle-state-value',
    'monitorIdleBtn',
    'idle-state-status-note',
    // Mobile Sensors
    'nfc-tag-value',
    'readNfcBtn',
    'writeNfcBtn',
    'nfc-tag-status-note',
    'vibration-value',
    'testVibrationBtn',
    'vibration-status-note',
    // Add any missing IDs from your HTML here
];

function initializeDOMCache() {
    logger.debug('Initializing DOM Cache...');
    elementIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            DOMElements[id] = element;
        } else {
            logger.warn(`DOM Element with ID '${id}' not found.`);
        }
    });
    logger.debug('DOM Cache Initialized.');
}

// --- Core Helper Functions ---

/**
 * Sets the text content of a cached DOM element and handles loading states.
 * @param {string} id - The ID of the element (must be in elementIds).
 * @param {string} text - The text to set.
 * @param {boolean} [isLoading=false] - Whether to keep element in loading state.
 */
const setElementText = (id, text) => {
    const el = DOMElements[id];
    if (el) {
        // Check if text is a loading/status indicator
        const isLoadingIndicator =
            text === 'GENERATING...' ||
            text === 'DETECTING...' ||
            text === 'CHECKING...' ||
            text === 'PENDING...';

        // If text is meaningful (not empty, not "loading"), remove loading class
        if (text && text !== '--' && !isLoadingIndicator) {
            el.classList.remove('loading');
            el.classList.remove('terminal-active');
        }

        // Add terminal effect to loading indicators
        if (isLoadingIndicator) {
            el.classList.add('terminal-active');
        } else {
            el.classList.remove('terminal-active');
        }

        el.textContent = text;
    } else {
        logger.warn(`setElementText: Element with ID '${id}' not found in cache.`);
    }
};

/**
 * Sets a severity class (low, medium, high) on a cached DOM element.
 * @param {string} id - The ID of the element.
 * @param {'low'|'medium'|'high'|null} level - The severity level or null to remove.
 */
const setSeverity = (id, level) => {
    const el = DOMElements[id];
    if (el) {
        el.classList.remove('severity-low', 'severity-medium', 'severity-high');
        if (level) {
            el.classList.add(`severity-${level}`);
        }
    } else {
        logger.warn(`setSeverity: Element with ID '${id}' not found in cache.`);
    }
};

/**
 * Displays an error message in a specific element and logs it.
 * @param {string} id - The ID of the element to display the error in.
 * @param {string} msg - The error message.
 * @param {Error|null} [err=null] - The associated error object (optional).
 * @param {'low'|'medium'|'high'} [level='high'] - The severity level.
 */
const showError = (id, msg, err = null, level = 'high') => {
    if (err) {
        logger.error(`UI Error in #${id}: ${msg}`, err);
    } else {
        logger.error(`UI Error in #${id}: ${msg}`);
    }
    setElementText(id, msg);
    setSeverity(id, level);
};

/**
 * Displays a status message in a permission/status note element.
 * @param {string} id - The ID of the status note element (e.g., 'location-status-note').
 * @param {string} msg - The message to display.
 * @param {boolean} [isError=false] - Whether to style the message as an error.
 */
const showStatusNote = (id, msg, isError = false) => {
    const el = DOMElements[id];
    if (el) {
        el.textContent = msg;
        el.classList.toggle('error-note', isError);
        el.classList.toggle('status-note', !isError); // Ensure only one style is active
    } else {
        logger.warn(`showStatusNote: Element with ID '${id}' not found in cache.`);
    }
};

/**
 * Checks if the page is loaded over HTTPS and shows a warning if not.
 * @returns {boolean} True if HTTPS, false otherwise.
 */
const checkHTTPS = () => {
    const isSecure = window.location.protocol === 'https:';
    if (!isSecure && DOMElements['https-warning']) {
        DOMElements['https-warning'].classList.remove('hidden');
        logger.warn('Application not running on HTTPS. Some features will be unavailable.');
    }
    return isSecure;
};

/**
 * Generates a simple, non-cryptographic hash from a string.
 * @param {string} str - The input string.
 * @returns {string} An 8-character hex string or 'N/A'.
 */
const generateSimpleHash = (str) => {
    let hash = 0;
    if (typeof str !== 'string' || str.length === 0) return 'N/A';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    // Convert to positive 32-bit unsigned integer hex string
    return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

// --- Enhanced Feature Detection for Maximum Coverage ---
const features = {
    // Basic Features
    isHTTPS: window.location.protocol === 'https:',
    hasGeo: 'geolocation' in navigator,
    hasMediaDevices:
        'mediaDevices' in navigator && typeof navigator.mediaDevices.getUserMedia === 'function',
    hasWebRTC: typeof RTCPeerConnection !== 'undefined',
    hasBattery: 'getBattery' in navigator,
    hasDeviceMemory: 'deviceMemory' in navigator,
    hasHardwareConcurrency: 'hardwareConcurrency' in navigator,
    hasBluetooth: 'bluetooth' in navigator,
    hasSpeechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    hasAmbientLight: 'AmbientLightSensor' in window,
    hasDeviceMotion: 'DeviceMotionEvent' in window,
    hasDeviceOrientation: 'DeviceOrientationEvent' in window,
    hasClipboardRead:
        'clipboard' in navigator && typeof navigator.clipboard.readText === 'function',
    hasClipboardWrite:
        'clipboard' in navigator && typeof navigator.clipboard.writeText === 'function',
    hasPermissionsAPI: 'permissions' in navigator,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasPlugins: 'plugins' in navigator,
    hasMimeTypes: 'mimeTypes' in navigator,

    // File System & Storage APIs
    hasFileSystemAccess: 'showOpenFilePicker' in window,
    hasDirectoryAccess: 'showDirectoryPicker' in window,
    hasPersistStorage: navigator.storage && typeof navigator.storage.persist === 'function',
    hasStorageEstimate: navigator.storage && typeof navigator.storage.estimate === 'function',

    // Hardware Access APIs
    hasWebUSB: 'usb' in navigator,
    hasWebHID: 'hid' in navigator,
    hasWebSerial: 'serial' in navigator,
    hasWebNFC: 'NDEFReader' in window,
    hasVibration: 'vibrate' in navigator,
    hasWebMIDI: 'requestMIDIAccess' in navigator,

    // Screen & Display APIs
    hasScreenCapture: navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices,
    hasFullscreen:
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen,
    hasScreenWakeLock: 'wakeLock' in navigator,
    hasScreenOrientation: screen.orientation && typeof screen.orientation.lock === 'function',

    // Background & Notification APIs
    hasPushAPI: 'PushManager' in window,
    hasBackgroundSync: 'SyncManager' in window && 'serviceWorker' in navigator,
    hasBackgroundFetch: 'BackgroundFetchManager' in window,
    hasNotificationAPI: 'Notification' in window,

    // Authentication & Payment APIs
    hasWebAuthn: 'PublicKeyCredential' in window,
    hasCredentialManagement: 'credentials' in navigator,
    hasPaymentRequest: 'PaymentRequest' in window,

    // Sensors & Environment
    hasIdleDetection: 'IdleDetector' in window,
    hasProximitySensor: 'ProximitySensor' in window,
    hasGyroscope: 'Gyroscope' in window,
    hasAccelerometer: 'Accelerometer' in window,
    hasMagnetometer: 'Magnetometer' in window,

    // Network Information
    hasNetworkInfo: 'connection' in navigator,
    hasDownlink: navigator.connection && 'downlink' in navigator.connection,

    // Misc Advanced APIs
    hasContactPicker: 'contacts' in navigator && 'ContactsManager' in window,
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    hasResizeObserver: 'ResizeObserver' in window,
    hasIntersectionObserver: 'IntersectionObserver' in window,
    hasWebShare: 'share' in navigator,
    hasSpeechSynthesis: 'speechSynthesis' in window,
    hasImageCapture: 'ImageCapture' in window,
    hasWebXR: 'xr' in navigator,
    hasWebCodecs: 'VideoEncoder' in window || 'AudioEncoder' in window,
};

// --- Global State Variables (Consider moving specific ones to relevant modules later) ---
let initialKeystrokeTimings = [];
let pageOpenTime = null;
let activeMediaStreams = { video: null, audio: null };
let behaviorIntervals = []; // To store interval IDs for cleanup
let updateIntervalId = null; // For the main update timer

// State related to privacy/risk scoring
let privacyFactors = {
    dnt: 0,
    webrtcLeak: 0,
    fingerprintUnique: -10,
    storage: 0,
    trackers: 0,
    permissions: 0,
    clipboard: 0,
    sensors: 0,
    audioCapture: 0,
    fontEnum: 0,
};
// State for digital footprint simulation (can be expanded)
let digitalFootprint = {
    categories: {
        identity: { score: 0, items: [] },
        behavior: { score: 0, items: [] },
        hardware: { score: 0, items: [] },
        network: { score: 0, items: [] },
        software: { score: 0, items: [] },
    },
    totalExposure: 0,
    identityConfidence: 0,
};

// Variables for event listeners (managed in event-listeners.js but declared here for broader access if needed)
// It's better practice to keep these within event-listeners.js if possible
// let cursorData = [];
// let scrollPositions = [];
// let keyTimingsLog = [];
// let clickData = [];
// let formInteractionStart = null;
// let lastMouseMoveTime = 0;
// let lastScrollTime = 0;
// let touchCount = 0;
// let lastTouchEnd = null;

logger.info('Config and Helpers Initialized.');

// --- Add ES Module exports ---
export { 
    CONFIG, 
    DOMElements, 
    logger, 
    setElementText, 
    setSeverity, 
    features,
    showError,
    showStatusNote,
    checkHTTPS,
    generateSimpleHash,
    initializeDOMCache 
};
