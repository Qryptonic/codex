/**
 * Data Collection Module for Owl Security Scanner
 * Coordinates all data collection activities and demonstrations
 * Enhanced for maximum capability demonstration
 */

'use strict';

// Import modules
// Removed imports for non-module structure
// Dependencies should be included directly in HTML

// Create a namespace for modules if we need actual implementations later
window.modules = window.modules || {};

// --- Core Functions ---

// Data collection main function
window.runEnhancedDataCollection = function(userName) {
    // CRITICAL: Check if data collection should be active
    // This is the primary control that ensures data collection only happens
    // after the user completes the 3-screen flow
    if (window.appState && !window.appState.dataCollectionActive) {
        console.log("Data collection is not active yet - waiting for user to reach dashboard");
        console.warn("Blocking data collection until user completes assessment flow and reaches dashboard");
        return false;
    }
    
    console.log("✓ Data collection authorized - user has completed assessment flow");
    
    if (typeof window.modules.dataCollection !== 'undefined' && 
        typeof window.modules.dataCollection.runEnhancedDataCollection === 'function') {
        console.log("Using modular implementation of runEnhancedDataCollection");
        return window.modules.dataCollection.runEnhancedDataCollection(userName);
    }
    console.warn("Enhanced data collection not available - using fallback");
    
    // Basic fallback implementation
    console.log(`Starting basic data collection for: ${userName || 'Anonymous User'}`);
    
    // Set username value
    const usernameEl = document.getElementById('username-value');
    if (usernameEl) {
        usernameEl.textContent = userName || 'Anonymous User';
    }
    
    // Set session ID
    const sessionEl = document.getElementById('session-id-value');
    if (sessionEl) {
        const sessionId = window.dataCollectionHash(navigator.userAgent + Date.now());
        sessionEl.textContent = sessionId;
    }
    
    // Collect basic fingerprints and use Web Worker for processing if available
    if (window.collectFingerprints) {
        const fingerprints = window.collectFingerprints();
        
        // Process fingerprints in Web Worker if available
        if (window.analyzeFingerprints && fingerprints) {
            console.log('Processing fingerprints in Web Worker...');
            window.analyzeFingerprints(fingerprints, (progress) => {
                console.log(`Fingerprint analysis progress: ${Math.round(progress * 100)}%`);
                const progressEl = document.getElementById('progress-value');
                if (progressEl) {
                    progressEl.textContent = `${Math.round(progress * 100)}%`;
                }
            }).then(results => {
                console.log('Fingerprint analysis complete');
                window.updateFingerprintDisplay(results);
            }).catch(err => {
                console.error('Error during fingerprint analysis:', err);
            });
        }
        
        // Run benchmarks in background if worker is available
        if (window.runBenchmark) {
            console.log('Running performance benchmarks...');
            window.runBenchmark('cpu', { iterations: 100000 }, (progress) => {
                console.log(`Benchmark progress: ${Math.round(progress * 100)}%`);
            }).then(results => {
                console.log('Benchmark complete:', results);
                const jsPerformanceEl = document.getElementById('js-performance');
                if (jsPerformanceEl && results.score) {
                    jsPerformanceEl.textContent = results.score.toFixed(2);
                }
            }).catch(err => {
                console.error('Error during benchmark:', err);
            });
        }
    }
    
    return true;
};

// Display fingerprint results
window.updateFingerprintDisplay = function(results) {
    if (!results) return;
    
    console.log('Updating display with fingerprint results');
    
    // Update uniqueness scores
    const privacyScoreEl = document.getElementById('privacy-score');
    if (privacyScoreEl && results.uniquenessScore) {
        privacyScoreEl.textContent = results.uniquenessScore.toFixed(2);
    }
    
    const trackingScoreEl = document.getElementById('tracking-score');
    if (trackingScoreEl && results.trackingRisk) {
        trackingScoreEl.textContent = results.trackingRisk.toFixed(2);
    }
    
    const identityScoreEl = document.getElementById('identity-score');
    if (identityScoreEl && results.identityExposure) {
        identityScoreEl.textContent = results.identityExposure.toFixed(2);
    }
    
    // Update exposed data
    const exposedDataEl = document.getElementById('exposed-data');
    if (exposedDataEl && results.exposedAttributes) {
        const attributesList = results.exposedAttributes.slice(0, 5).join(', ');
        exposedDataEl.textContent = attributesList || 'None detected';
    }
    
    // Update trackers value
    const trackersValueEl = document.getElementById('trackers-value');
    if (trackersValueEl && results.potentialTrackers) {
        trackersValueEl.textContent = results.potentialTrackers || 0;
    }
    
    // Update summary scores
    const summaryIdentityEl = document.getElementById('summary-identity-exposure');
    if (summaryIdentityEl && results.identityExposure) {
        summaryIdentityEl.textContent = results.identityExposure.toFixed(1);
    }
    
    const summaryTrackingEl = document.getElementById('summary-tracking-potential');
    if (summaryTrackingEl && results.trackingRisk) {
        summaryTrackingEl.textContent = results.trackingRisk.toFixed(1);
    }
    
    // Update gauges
    const identityGaugeEl = document.getElementById('identity-gauge');
    if (identityGaugeEl && results.identityExposure) {
        const percentage = Math.min(100, Math.max(0, results.identityExposure * 10));
        identityGaugeEl.style.width = `${percentage}%`;
    }
    
    const trackingGaugeEl = document.getElementById('tracking-gauge');
    if (trackingGaugeEl && results.trackingRisk) {
        const percentage = Math.min(100, Math.max(0, results.trackingRisk * 10));
        trackingGaugeEl.style.width = `${percentage}%`;
    }
};

// Essential utilities
window.dataCollectionHash = function(str) {
    if (typeof window.modules.core !== 'undefined' && 
        typeof window.modules.core.dataCollectionHash === 'function') {
        return window.modules.core.dataCollectionHash(str);
    }
    
    // Fallback implementation
    let hash = 0;
    if (typeof str !== 'string' || str.length === 0) return hash.toString(16);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
};

window.estimateLocationFromTimezone = function(timezone) {
    if (typeof window.modules.estimateLocationFromTimezone !== 'undefined') {
        return window.modules.estimateLocationFromTimezone(timezone);
    }
    return timezone || "Unknown Location";
};

// --- Device Information ---

window.getDeviceType = function() {
    if (typeof window.modules.getDeviceType !== 'undefined') {
        return window.modules.getDeviceType();
    }
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini/i.test(ua)) {
        return 'Mobile';
    }
    return 'Desktop';
};

window.getOSInfo = function() {
    if (typeof window.modules.getOSInfo !== 'undefined') {
        return window.modules.getOSInfo();
    }
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iOS|iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Unknown OS';
};

// --- Permission Functions ---

window.attemptLocation = function() {
    if (typeof window.modules.attemptLocation !== 'undefined') {
        return window.modules.attemptLocation();
    }
    console.warn("Location function not available");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => console.log("Location access granted"),
            err => console.warn("Location access denied or error", err)
        );
    }
};

window.attemptCameraAccess = function() {
    if (typeof window.modules.attemptCameraAccess !== 'undefined') {
        return window.modules.attemptCameraAccess();
    }
    console.warn("Camera access function not available");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log("Camera access granted");
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => console.warn("Camera access denied or error", err));
    }
};

window.attemptMicAccess = function() {
    if (typeof window.modules.attemptMicAccess !== 'undefined') {
        return window.modules.attemptMicAccess();
    }
    console.warn("Mic access function not available");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Microphone access granted");
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => console.warn("Microphone access denied or error", err));
    }
};

window.attemptSpeechRecognition = function() {
    if (typeof window.modules.attemptSpeechRecognition !== 'undefined') {
        return window.modules.attemptSpeechRecognition();
    }
    console.warn("Speech recognition function not available");
};

// --- Worker Helpers ---

window.getWorkerHelper = function() {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.getWorkerHelper === 'function') {
        return window.modules.workerHelper.getWorkerHelper();
    }
    console.warn("Worker helper not available");
    return null;
};

window.executeHeavyTask = function(task, data, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.executeHeavyTask === 'function') {
        return window.modules.workerHelper.executeHeavyTask(task, data, progressCallback);
    }
    console.warn("Heavy task execution not available");
    return null;
};

window.analyzeFingerprints = function(data, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.analyzeFingerprints === 'function') {
        return window.modules.workerHelper.analyzeFingerprints(data, progressCallback);
    }
    console.warn("Fingerprint analysis not available");
    return null;
};

window.processData = function(data, options, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.processData === 'function') {
        return window.modules.workerHelper.processData(data, options, progressCallback);
    }
    console.warn("Data processing not available");
    return null;
};

window.analyzeNetwork = function(networkData, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.analyzeNetwork === 'function') {
        return window.modules.workerHelper.analyzeNetwork(networkData, progressCallback);
    }
    console.warn("Network analysis not available");
    return null;
};

window.runBenchmark = function(benchmarkType, options, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.runBenchmark === 'function') {
        return window.modules.workerHelper.runBenchmark(benchmarkType, options, progressCallback);
    }
    console.warn("Benchmark function not available");
    return null;
};

window.benchmarkPerformance = function(iterations, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.benchmarkPerformance === 'function') {
        return window.modules.workerHelper.benchmarkPerformance(iterations, progressCallback);
    }
    console.warn("Legacy benchmark function not available");
    return null;
};

window.analyzeImage = function(imageData, options, progressCallback) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.analyzeImage === 'function') {
        return window.modules.workerHelper.analyzeImage(imageData, options, progressCallback);
    }
    console.warn("Image analysis not available");
    return null;
};

window.calculateEntropy = function(data, options) {
    if (typeof window.modules.workerHelper !== 'undefined' && 
        typeof window.modules.workerHelper.calculateEntropy === 'function') {
        return window.modules.workerHelper.calculateEntropy(data, options);
    }
    console.warn("Entropy calculation not available");
    return null;
};

// --- Fingerprinting ---

window.collectFingerprints = function() {
    if (typeof window.modules.collectFingerprints !== 'undefined') {
        return window.modules.collectFingerprints();
    }
    console.warn("Fingerprinting function not available");
    return null;
};

window.generateCanvasFingerprint = function() { 
    console.warn("Canvas fingerprinting not available"); 
    return "UNAVAILABLE"; 
};

window.generateWebGLFingerprint = function() { 
    console.warn("WebGL fingerprinting not available"); 
    return "UNAVAILABLE"; 
};

window.generateAudioFingerprint = function() { 
    console.warn("Audio fingerprinting not available"); 
    return "UNAVAILABLE"; 
};

window.generateSVGFingerprint = function() { 
    console.warn("SVG fingerprinting not available"); 
    return "UNAVAILABLE"; 
};

window.generateLocalizationFingerprint = function() { 
    console.warn("Localization fingerprinting not available"); 
    return "UNAVAILABLE"; 
};

window.detectFonts = function() { 
    console.warn("Font detection not available"); 
    return []; 
};

// --- Network Functions ---

window.getWebRTCIP = function() { 
    console.warn("WebRTC IP detection not available"); 
    return null;
};

window.fetchPublicIP = function() { 
    console.warn("Public IP detection not available"); 
    return null;
};

window.testNetworkSpeed = function() { 
    console.warn("Network speed test not available"); 
    return null;
};

window.simulateNetworkMap = function() { 
    console.warn("Network map simulation not available"); 
    return null;
};

window.simulateTrackerDetection = function() { 
    console.warn("Tracker detection simulation not available"); 
    return null;
};

window.getDNTStatus = function() { 
    console.warn("DNT status detection not available"); 
    return false;
};

window.analyzeResourceTiming = function() { 
    console.warn("Resource timing analysis not available"); 
    return null;
};

// --- Hardware Analysis ---

window.getBatteryInfo = function() { 
    console.warn("Battery info detection not available"); 
    return null;
};

window.detectGPUInfo = function() { 
    console.warn("GPU info detection not available"); 
    return null;
};

window.benchmarkJSPerformance = function() { 
    console.warn("JS performance benchmark not available"); 
    return null;
};

window.performTimingAnalysis = function() { 
    console.warn("Timing analysis not available"); 
    return null;
};

window.analyzeGPUPerformance = function() { 
    console.warn("GPU performance analysis not available"); 
    return null;
};

window.detectHardwareVulnerabilities = function() { 
    console.warn("Hardware vulnerability detection not available"); 
    return null;
};

// --- Behavioral Analysis ---

window.initBehavioralAnalysis = function() { 
    console.warn("Behavioral analysis not available"); 
    return null;
};

window.setupBehaviorListeners = function() { 
    console.warn("Behavior listeners not available"); 
    return null;
};

window.cleanupBehaviorListeners = function() { 
    console.warn("Behavior listener cleanup not available"); 
    return null;
};

window.performBehavioralAnalysis = function() { 
    console.warn("Behavioral analysis not available"); 
    return null;
};

// --- Hardware Connect ---

window.initializeHardwareConnect = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.initializeHardwareConnect === 'function') {
        return window.modules.hardwareConnect.initializeHardwareConnect();
    }
    console.warn("Hardware connect module not available");
    return null;
};

window.connectToUSBDevice = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.connectToUSBDevice === 'function') {
        return window.modules.hardwareConnect.connectToUSBDevice();
    }
    console.warn("USB connection not available"); 
    return null;
};

window.connectToHIDDevice = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.connectToHIDDevice === 'function') {
        return window.modules.hardwareConnect.connectToHIDDevice();
    }
    console.warn("HID connection not available"); 
    return null;
};

window.connectToSerialDevice = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.connectToSerialDevice === 'function') {
        return window.modules.hardwareConnect.connectToSerialDevice();
    }
    console.warn("Serial connection not available"); 
    return null;
};

window.enumerateUSBDevices = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.enumerateUSBDevices === 'function') {
        return window.modules.hardwareConnect.enumerateUSBDevices();
    }
    console.warn("USB enumeration not available"); 
    return null;
};

window.detectMIDIDevices = function() {
    if (typeof window.modules.hardwareConnect !== 'undefined' && 
        typeof window.modules.hardwareConnect.detectMIDIDevices === 'function') {
        return window.modules.hardwareConnect.detectMIDIDevices();
    }
    console.warn("MIDI detection not available"); 
    return null;
};

// --- Storage Functions ---

window.requestPersistentStorage = function() { 
    console.warn("Persistent storage request not available"); 
    return null;
};

window.analyzeStorageDetails = function() { 
    console.warn("Storage analysis not available"); 
    return null;
};

window.getStorageInfo = function() { 
    console.warn("Storage info not available"); 
    return null;
};

// --- Background/State Functions ---

window.enablePushNotifications = function() { 
    console.warn("Push notifications not available"); 
    return null;
};

window.queueBackgroundSync = function() { 
    console.warn("Background sync not available"); 
    return null;
};

window.requestNotificationPermission = function() { 
    console.warn("Notification permission request not available"); 
    return null;
};

window.simulatePushNotification = function() { 
    console.warn("Push notification simulation not available"); 
    return null;
};

window.testSpeechSynthesis = function() { 
    console.warn("Speech synthesis not available"); 
    return null;
};

window.monitorIdleState = function() { 
    console.warn("Idle state monitoring not available"); 
    return null;
};

window.requestWakeLock = function() { 
    console.warn("Wake lock request not available"); 
    return null;
};

window.lockScreenOrientation = function() { 
    console.warn("Screen orientation lock not available"); 
    return null;
};

// --- Browser Interface Functions ---

window.checkWebAuthnSupport = function() { 
    console.warn("WebAuthn support check not available"); 
    return null;
};

window.checkPaymentMethodSupport = function() { 
    console.warn("Payment method support check not available"); 
    return null;
};

window.writeToClipboard = function() { 
    console.warn("Clipboard write not available"); 
    return null;
};

window.requestScreenCapture = function() { 
    console.warn("Screen capture request not available"); 
    return null;
};

window.checkClipboard = function() { 
    console.warn("Clipboard check not available"); 
    return null;
};

// --- Sensors/Permissions Functions ---

window.scanBluetooth = function() { 
    console.warn("Bluetooth scan not available"); 
    return null;
};

window.readNfcTag = function() { 
    console.warn("NFC tag read not available"); 
    return null;
};

window.writeNfcTag = function() { 
    console.warn("NFC tag write not available"); 
    return null;
};

window.testVibration = function() { 
    console.warn("Vibration test not available"); 
    return null;
};

window.checkXRCapabilities = function() { 
    console.warn("XR capabilities check not available"); 
    return null;
};

window.requestContacts = function() { 
    console.warn("Contacts request not available"); 
    return null;
};

window.handleDeviceMotion = function() { 
    console.warn("Device motion handling not available"); 
    return null;
};

window.handleDeviceOrientation = function() { 
    console.warn("Device orientation handling not available"); 
    return null;
};

window.handleAmbientLight = function() { 
    console.warn("Ambient light handling not available"); 
    return null;
};

// --- Browser Info Functions ---

window.getPlugins = function() { 
    console.warn("Plugin detection not available"); 
    return null;
};

window.getMediaCodecs = function() { 
    console.warn("Media codec detection not available"); 
    return null;
};

window.getBrowserInfo = function() { 
    console.warn("Browser info detection not available"); 
    return null;
};

window.detectExtensions = function() { 
    console.warn("Extension detection not available"); 
    return null;
};

window.detectBrowserAutomation = function() { 
    console.warn("Browser automation detection not available"); 
    return null;
};

// --- File Operations ---

window.analyzeFileMetadata = function() { 
    console.warn("File metadata analysis not available"); 
    return null;
};

window.saveSummaryToFile = function() { 
    console.warn("File saving not available"); 
    return null;
};

// Make sure we have DOMElements defined even if config.js doesn't create it
if (typeof window.DOMElements === 'undefined') {
    console.warn("DOMElements not found, creating empty object");
    window.DOMElements = {};
}

// Make sure we have CONFIG defined even if config.js doesn't create it
if (typeof window.CONFIG === 'undefined') {
    console.warn("CONFIG not found, creating default values");
    window.CONFIG = {
        MAX_KEYSTROKE_LINES: 8,
        WEBRTC_TIMEOUT: 5000,
        CURSOR_DATA_LIMIT: 40,
        SCROLL_DATA_LIMIT: 30,
        MOUSE_THROTTLE_MS: 120,
        SCROLL_THROTTLE_MS: 180,
        CAMERA_PREVIEW_DURATION: 4000,
        MIC_ACTIVE_DURATION: 4000,
        SANITIZE_KEYSTROKES: false,
        LOG_LEVEL: 'debug',
        NETWORK_MAP_REFRESH_MS: 12000,
        NOISE_ANALYSIS_INTERVAL: 5000,
        SPEED_TEST_SIZE: 1000000,
        FONT_TEST_LIMIT: 50,
        BENCHMARK_ITERATIONS: 1000000,
        UPDATE_INTERVAL_MS: 1000
    };
}

// Log that the module has been loaded
console.log("Data collection module loaded with modular architecture");