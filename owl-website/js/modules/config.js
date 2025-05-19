/**
 * Configuration Module
 * Central configuration for the Owl Security Scanner application
 */

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};

/**
 * Main configuration object with application settings
 */
const CONFIG = {
    // Application settings
    appName: 'Owl Security Scanner',
    version: '1.2.0',
    debugMode: true, // Enable for easier debugging
    
    // Feature flags
    features: {
        deviceDetection: true,
        locationTracking: true,
        hardwareScanning: true,
        fileSystemAccess: true,
        pushNotifications: true,
        behaviorAnalysis: true
    },
    
    // Risk assessment thresholds
    riskThresholds: {
        low: 30,
        medium: 60,
        high: 80
    },
    
    // API endpoint configurations
    apiEndpoints: {
        dataSubmission: 'https://api.example.com/submit',
        riskAnalysis: 'https://api.example.com/analyze'
    },
    
    // UI configuration
    ui: {
        theme: 'cyberpunk',
        animations: true,
        dashboardRefreshRate: 5000, // ms
        maxLogEntries: 100
    },
    
    // Data collection settings
    dataCollection: {
        samplingRate: 1000, // ms
        maxStorageSize: 5 * 1024 * 1024, // 5MB
        retentionPeriod: 30, // days
        CURSOR_DATA_LIMIT: 40,
        SCROLL_DATA_LIMIT: 30,
        MOUSE_THROTTLE_MS: 120,
        SCROLL_THROTTLE_MS: 180,
        FONT_TEST_LIMIT: 50,
        BENCHMARK_ITERATIONS: 1000000,
        UPDATE_INTERVAL_MS: 1000
    }
};

/**
 * DOM Element references for easy access throughout the application
 * These will be populated during app initialization
 */
const DOMElements = {
    // Main containers
    mainApp: null,
    dashboard: null,
    scanResults: null,
    
    // Risk score displays
    overallRiskScore: null,
    privacyRiskScore: null,
    securityRiskScore: null,
    exposureRiskScore: null,
    
    // Information panels
    deviceInfo: null,
    browserInfo: null,
    networkInfo: null,
    locationInfo: null,
    
    // Control elements
    startScanButton: null,
    stopScanButton: null,
    resetButton: null,
    
    // Notification elements
    notificationArea: null,
    toastContainer: null
};

/**
 * Logger configuration
 * Centralizes logging for the application with customizable logging levels
 */
const logger = {
    // Log levels
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    
    // Current log level threshold
    currentLevel: 0, // DEBUG
    
    // Whether to include timestamps in logs
    timestamps: true,
    
    // Log to console methods
    debug: function(...args) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.debug(this._formatMessage('DBG', ...args));
        }
    },
    
    info: function(...args) {
        if (this.currentLevel <= this.LEVELS.INFO) {
            console.info(this._formatMessage('INF', ...args));
        }
    },
    
    warn: function(...args) {
        if (this.currentLevel <= this.LEVELS.WARN) {
            console.warn(this._formatMessage('WRN', ...args));
        }
    },
    
    error: function(...args) {
        if (this.currentLevel <= this.LEVELS.ERROR) {
            console.error(this._formatMessage('ERR', ...args));
        }
    },
    
    // Helper to format log messages
    _formatMessage: function(level, ...args) {
        const timestamp = this.timestamps ? `[${new Date().toISOString()}]` : '';
        return [`[${level}]${timestamp}`, ...args];
    },
    
    // Change the current logging level
    setLevel: function(level) {
        if (typeof level === 'string') {
            level = this.LEVELS[level.toUpperCase()] || 0;
        }
        this.currentLevel = level;
        this.info(`Log level set to ${level}`);
    }
};

/**
 * Feature detection functionality
 * Tests browser capabilities for various features used in the application
 */
const features = {
    /**
     * Run all feature detection tests
     * @returns {Object} Feature support status
     */
    detectAll: function() {
        return {
            geolocation: this.hasGeolocation(),
            webRTC: this.hasWebRTC(),
            localStorage: this.hasLocalStorage(),
            indexedDB: this.hasIndexedDB(),
            serviceWorker: this.hasServiceWorker(),
            pushManager: this.hasPushManager(),
            fileSystem: this.hasFileSystem(),
            bluetooth: this.hasBluetooth(),
            usb: this.hasUSB(),
            notifications: this.hasNotifications()
        };
    },
    
    hasGeolocation: function() {
        return !!navigator.geolocation;
    },
    
    hasWebRTC: function() {
        return !!(navigator.mediaDevices && 
               navigator.mediaDevices.getUserMedia && 
               window.RTCPeerConnection);
    },
    
    hasLocalStorage: function() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    },
    
    hasIndexedDB: function() {
        return !!window.indexedDB;
    },
    
    hasServiceWorker: function() {
        return 'serviceWorker' in navigator;
    },
    
    hasPushManager: function() {
        return 'PushManager' in window;
    },
    
    hasFileSystem: function() {
        return 'showOpenFilePicker' in window || 
               'webkitRequestFileSystem' in window;
    },
    
    hasBluetooth: function() {
        return 'bluetooth' in navigator;
    },
    
    hasUSB: function() {
        return 'usb' in navigator;
    },
    
    hasNotifications: function() {
        return 'Notification' in window;
    }
};

/**
 * UI helper functions
 * Common utilities for manipulating the UI
 */
const uiHelpers = {
    /**
     * Set text content of an element safely
     * @param {HTMLElement} element - The DOM element
     * @param {string} text - Text to set
     */
    setElementText: function(element, text) {
        if (element) {
            element.textContent = text;
        }
    },
    
    /**
     * Set element severity class based on risk level
     * @param {HTMLElement} element - The DOM element
     * @param {string} severity - Severity level (low, medium, high)
     */
    setSeverity: function(element, severity) {
        if (!element) return;
        
        // Remove existing severity classes
        element.classList.remove('low', 'medium', 'high', 'minimal');
        
        // Add new severity class
        if (['minimal', 'low', 'medium', 'high'].includes(severity)) {
            element.classList.add(severity);
        }
    },
    
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Notification type (info, success, warning, error)
     * @param {number} duration - How long to show the toast in ms
     */
    showToast: function(message, type = 'info', duration = 3000) {
        if (!DOMElements.toastContainer) {
            logger.warn('Toast container not available');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        DOMElements.toastContainer.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300); // After fade out animation
        }, duration);
    }
};

/**
 * Initializes the DOM element cache - **DEPRECATED/REMOVED**
 * Logic moved to main.js to ensure proper timing.
 */
// export function initializeDOMCache() { ... }

// --- IMMEDIATE GLOBAL SETUP --- 
// Make core config and logger available immediately on load
window.CONFIG = CONFIG;
window.logger = logger;

// Make module available globally
window.modules.config = {
    CONFIG,
    logger,
    features,
    // initializeDOMCache // Removed
    uiHelpers // Export uiHelpers if needed elsewhere
};

logger.info('Config module loaded and globals initialized.'); 