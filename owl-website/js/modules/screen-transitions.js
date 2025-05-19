/**
 * Screen Transitions Module for OWL Sentinel
 * Handles the transitions between landing page, assessment, and dashboard
 */

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};

// Global app state to track where the user is and control data collection
window.appState = {
    currentScreen: 'landing', // 'landing', 'assessment', 'dashboard'
    dataCollectionActive: false, // Flag to ensure data collection only starts after consent
    assessmentProgress: 0,
    startTime: new Date(),
    assessmentComplete: false
};

// DOM Elements needed for screen transitions
let landingScreen = null;
let assessmentScreen = null;
let dashboardScreen = null;
let startScanButton = null;
let continueButton = null;
let progressBar = null;
let progressText = null;
let scanLog = null;

/**
 * Initialize the screen transitions module
 * This sets up all the event listeners and references
 */
function initScreenTransitions() {
    console.log('[Screen Transitions] Initializing...');

    // Get references to screens
    landingScreen = document.getElementById('landing-screen');
    assessmentScreen = document.getElementById('assessment-screen');
    dashboardScreen = document.getElementById('dashboard-screen');
    
    // Get references to buttons
    startScanButton = document.getElementById('start-scan-button');
    continueButton = document.getElementById('continue-button');
    
    // Get references to progress elements
    progressBar = document.getElementById('assessment-progress-bar');
    progressText = document.getElementById('assessment-progress-text');
    scanLog = document.getElementById('scan-log');
    
    // Set up button event listeners
    if (startScanButton) {
        startScanButton.addEventListener('click', startAssessment);
        console.log('[Screen Transitions] Start scan button listener set up');
    } else {
        console.error('[Screen Transitions] Start scan button not found');
    }
    
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            if (window.appState.assessmentComplete) {
                showDashboard();
            }
        });
        console.log('[Screen Transitions] Continue button listener set up');
    } else {
        console.error('[Screen Transitions] Continue button not found');
    }
    
    console.log('[Screen Transitions] Initialization complete');
}

/**
 * Start the assessment process
 * Transitions from landing page to assessment screen
 */
function startAssessment() {
    console.log('[Screen Transitions] Starting assessment...');
    
    // Update app state
    window.appState.currentScreen = 'assessment';
    window.appState.startTime = new Date();
    
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
    console.log('[Screen Transitions] Starting progress animation...');
    
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
function showDashboard() {
    console.log('[Screen Transitions] Showing dashboard and starting data collection...');
    
    // Update app state
    window.appState.currentScreen = 'dashboard';
    
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
    console.log('[Screen Transitions] Starting data collection process...');
    
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
    
    console.log('[Screen Transitions] Data collection started. All APIs are now active.');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initScreenTransitions);

// Export functions to global scope
window.startAssessment = startAssessment;
window.showDashboard = showDashboard;
window.modules.screenTransitions = {
    startAssessment,
    showDashboard,
    startDataCollection
};

console.log('[Screen Transitions] Module loaded');