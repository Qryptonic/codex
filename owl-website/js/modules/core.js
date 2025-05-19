/**
 * Core Module for Owl Security Scanner
 * Provides core functions and utilities used across all modules
 */

'use strict';

// Use globals from config
const CONFIG = window.CONFIG;
const logger = window.logger;

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.core = window.modules.core || {};

// Global app state - used to track screens and data collection state
window.appState = {
    currentScreen: 'landing', // 'landing', 'assessment', 'dashboard'
    dataCollectionActive: false, // Flag to ensure data collection only starts after consent
    assessmentProgress: 0,
    startTime: new Date(),
    userName: '',
    assessmentComplete: false
};

/**
 * Generate a consistent hash from a string
 * @param {string} str - The string to hash
 * @returns {string} - The hashed result
 */
function dataCollectionHash(str) {
    if (!str || typeof str !== 'string') {
        return 'INVALID';
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex string and ensure it's 8 characters with leading 0s
    return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Combines multiple values into a single hash
 * @param  {...any} values - Values to combine
 * @returns {string} - Combined hash
 */
function combineHashes(...values) {
    const combinedString = values.map(v => String(v)).join('|');
    return dataCollectionHash(combinedString);
}

/**
 * Safely execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {any[]} args - Arguments to pass
 * @param {any} defaultValue - Default value to return on error
 * @returns {any} - Result or default value
 */
function safeExecute(fn, args = [], defaultValue = null) {
    try {
        return fn(...args);
    } catch (error) {
        logger.error(`Error executing function: ${fn.name}`, error);
        return defaultValue;
    }
}

/**
 * Format a value with a unit
 * @param {number} value - The value to format
 * @param {string} unit - The unit to append
 * @returns {string} - Formatted string
 */
function formatWithUnit(value, unit) {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    
    return `${value} ${unit}`;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} func - Function to throttle
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} - Throttled function
 */
function throttle(func, wait = 100) {
    let timeout = null;
    let last = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - last);
        
        if (remaining <= 0) {
            last = now;
            return func.apply(this, args);
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                last = Date.now();
                func.apply(this, args);
            }, remaining);
        }
    };
}

/**
 * Debounce a function to ensure it's only called after a certain period of inactivity
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 100) {
    let timeout;
    
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

// Assign core functions to the modules namespace
window.modules.core = {
    dataCollectionHash,
    combineHashes,
    safeExecute,
    formatWithUnit,
    formatFileSize,
    throttle,
    debounce
};

// Also expose directly on window for backward compatibility
window.dataCollectionHash = dataCollectionHash;
window.combineHashes = combineHashes;
window.formatWithUnit = formatWithUnit;
window.formatFileSize = formatFileSize;

/**
 * Sets the text content of an element safely
 * @param {string} elementId - The ID of the element
 * @param {string} text - The text to set
 */
export function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Sets a severity class on an element
 * @param {string} elementId - The ID of the element
 * @param {string} severity - The severity level (low, medium, high)
 */
export function setSeverity(elementId, severity) {
    const element = document.getElementById(elementId);
    if (element) {
        // Remove existing severity classes
        element.classList.remove('severity-low', 'severity-medium', 'severity-high');
        
        // Add new severity class
        if (severity) {
            element.classList.add(`severity-${severity}`);
        }
    }
}

/**
 * Start the assessment process
 * Transitions from landing page to assessment screen
 */
export function startAssessment() {
    logger.info('Starting assessment process...');
    
    // Update app state
    window.appState.currentScreen = 'assessment';
    window.appState.startTime = new Date();
    
    // Get screen elements
    const landingScreen = document.getElementById('landing-screen');
    const assessmentScreen = document.getElementById('assessment-screen');
    
    // Hide landing screen
    if (landingScreen) {
        landingScreen.classList.remove('active');
        landingScreen.classList.add('hidden');
    }
    
    // Show assessment screen
    if (assessmentScreen) {
        assessmentScreen.classList.remove('hidden');
        assessmentScreen.classList.add('active');
        
        // Start progress animation
        startProgressAnimation();
    }
}

/**
 * Start the progress animation for the assessment screen
 */
function startProgressAnimation() {
    logger.info('Starting assessment progress animation...');
    
    // Get elements
    const progressBar = document.getElementById('assessment-progress-bar');
    const progressText = document.getElementById('assessment-progress-text');
    const scanLog = document.getElementById('scan-log');
    const continueButton = document.getElementById('continue-button');
    
    // Reset progress
    window.appState.assessmentProgress = 0;
    
    // Progress messages to display
    const progressMessages = [
        "Initializing scan environment...",
        "Scanning network interfaces...",
        "Analyzing browser configuration...",
        "Checking hardware specifications...",
        "Detecting installed plugins...",
        "Analyzing system fingerprint...",
        "Mapping potential vulnerabilities...",
        "Generating risk assessment model...",
        "Preparing dashboard visualization...",
        "Scan complete. Results ready for review."
    ];
    
    // Update scan log with initial message
    if (scanLog) {
        scanLog.innerHTML = `<div class="log-entry">
            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
            <span class="message">SCAN INITIALIZED. PROCESSING...</span>
        </div>`;
    }
    
    // Animation interval
    const interval = setInterval(() => {
        // Increment progress
        window.appState.assessmentProgress += 1;
        
        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${window.appState.assessmentProgress}%`;
        }
        
        // Update progress text
        if (progressText) {
            progressText.textContent = `${window.appState.assessmentProgress}%`;
        }
        
        // Add log entries at specific points
        if (window.appState.assessmentProgress % 10 === 0 && scanLog) {
            const messageIndex = Math.floor(window.appState.assessmentProgress / 10) - 1;
            if (messageIndex >= 0 && messageIndex < progressMessages.length) {
                scanLog.innerHTML += `<div class="log-entry">
                    <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                    <span class="message">${progressMessages[messageIndex]}</span>
                </div>`;
                
                // Scroll to bottom
                scanLog.scrollTop = scanLog.scrollHeight;
            }
        }
        
        // Enable continue button and complete assessment at 100%
        if (window.appState.assessmentProgress >= 100) {
            clearInterval(interval);
            window.appState.assessmentComplete = true;
            
            // Enable continue button
            if (continueButton) {
                continueButton.classList.remove('disabled');
                
                // Add flashing animation to encourage clicking
                continueButton.classList.add('ready-pulse');
            }
            
            // Final log entry
            if (scanLog) {
                scanLog.innerHTML += `<div class="log-entry highlight">
                    <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                    <span class="message">ASSESSMENT COMPLETE. DASHBOARD READY.</span>
                </div>`;
                
                // Scroll to bottom
                scanLog.scrollTop = scanLog.scrollHeight;
            }
        }
    }, 100); // Update every 100ms for a total of 10 seconds
}

/**
 * Show the dashboard
 * Transitions from assessment screen to dashboard
 * This is where data collection should begin
 */
export function showDashboard() {
    logger.info('Showing dashboard and starting data collection...');
    
    // Update app state
    window.appState.currentScreen = 'dashboard';
    
    // Get screen elements
    const assessmentScreen = document.getElementById('assessment-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    // Hide assessment screen
    if (assessmentScreen) {
        assessmentScreen.classList.remove('active');
        assessmentScreen.classList.add('hidden');
    }
    
    // Show dashboard screen
    if (dashboardScreen) {
        dashboardScreen.classList.remove('hidden');
        dashboardScreen.classList.add('active');
    }
    
    // Start data collection
    startDataCollection();
}

/**
 * Start data collection
 * This should only be called after the user has seen the landing page,
 * completed the assessment, and reached the dashboard
 */
function startDataCollection() {
    logger.info('Starting data collection process...');
    
    // Set the flag to indicate data collection is active
    window.appState.dataCollectionActive = true;
    
    // Call the main data collection function if available
    if (typeof window.runEnhancedDataCollection === 'function') {
        window.runEnhancedDataCollection();
    }
    
    // Initialize APIs if available
    if (typeof window.initializeAPIs === 'function') {
        window.initializeAPIs();
    }
    
    // Set up advanced event listeners if available
    if (typeof window.setupAdvancedEventListeners === 'function') {
        window.setupAdvancedEventListeners();
    }
    
    logger.info('Data collection started. All APIs are now active.');
}

// Update the modules namespace with screen transition functions
window.modules.core = {
    ...window.modules.core,
    setElementText,
    setSeverity,
    startAssessment,
    showDashboard
};

// Add to window for direct access
window.setElementText = setElementText;
window.setSeverity = setSeverity;
window.startAssessment = startAssessment;
window.showDashboard = showDashboard;

// Initialize screen transitions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners for screen transitions
    const startScanButton = document.getElementById('start-scan-button');
    const continueButton = document.getElementById('continue-button');
    
    if (startScanButton) {
        startScanButton.addEventListener('click', startAssessment);
        logger.debug('Start scan button event listener set up');
    }
    
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            if (window.appState.assessmentComplete) {
                showDashboard();
            }
        });
        logger.debug('Continue button event listener set up');
    }
    
    logger.info('Screen transition handlers initialized');
});

logger.info('Core module with screen transitions loaded.');