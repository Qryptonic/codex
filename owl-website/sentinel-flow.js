/**
 * OWL Sentinel - Screen Flow and Data Collection Manager
 * Handles transitions between landing page, assessment, and dashboard
 * Ensures data collection only starts after user consent and reaching dashboard
 */

// Global state to track screens and data collection
const appState = {
    currentScreen: 'landing',
    dataCollectionActive: false,
    assessmentProgress: 0,
    assessmentComplete: false,
    startTime: new Date()
};

// Wait for DOM to be loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('OWL Sentinel initialized');
    
    // Initialize screen transition handlers
    initScreenTransitions();
    
    // Try to collect data - this should fail until user reaches dashboard
    attemptDataCollection();
});

// Set up screen transitions
function initScreenTransitions() {
    // Get screen elements
    const landingScreen = document.getElementById('landing-screen');
    const assessmentScreen = document.getElementById('assessment-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    // Get button elements
    const startScanButton = document.getElementById('start-scan-button');
    const continueButton = document.getElementById('continue-button');
    
    // Transition: Landing Screen → Assessment Screen
    if (startScanButton) {
        startScanButton.addEventListener('click', function() {
            console.log('Starting assessment process...');
            
            // Update state
            appState.currentScreen = 'assessment';
            
            // Hide landing screen
            landingScreen.classList.remove('active');
            landingScreen.classList.add('hidden');
            
            // Show assessment screen
            assessmentScreen.classList.remove('hidden');
            assessmentScreen.classList.add('active');
            
            // Start assessment progress animation
            runAssessment();
        });
    }
    
    // Transition: Assessment Screen → Dashboard Screen
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            // Only proceed if assessment is complete
            if (!appState.assessmentComplete) {
                return;
            }
            
            console.log('Proceeding to dashboard...');
            
            // Update state
            appState.currentScreen = 'dashboard';
            
            // Hide assessment screen
            assessmentScreen.classList.remove('active');
            assessmentScreen.classList.add('hidden');
            
            // Show dashboard screen
            dashboardScreen.classList.remove('hidden');
            dashboardScreen.classList.add('active');
            
            // THIS IS THE KEY PART: Only activate data collection after reaching dashboard
            appState.dataCollectionActive = true;
            console.log('Data collection activated');
            
            // Now that we're authorized, start collecting data
            startDataCollection();
        });
    }
}

// Run the assessment process animation
function runAssessment() {
    console.log('Running security assessment...');
    
    // Get progress elements
    const progressBar = document.getElementById('assessment-progress-bar');
    const progressText = document.getElementById('assessment-progress-text');
    const scanLog = document.getElementById('scan-log');
    const continueButton = document.getElementById('continue-button');
    
    // Reset progress
    appState.assessmentProgress = 0;
    appState.assessmentComplete = false;
    
    // Assessment messages to display during progress
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
    
    // Add initial log entry
    if (scanLog) {
        scanLog.innerHTML = `<div class="log-entry">
            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
            <span class="message">SCAN INITIALIZED. PROCESSING...</span>
        </div>`;
    }
    
    // Run progress animation
    const interval = setInterval(function() {
        // Increment progress
        appState.assessmentProgress += 1;
        
        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${appState.assessmentProgress}%`;
        }
        
        // Update progress text
        if (progressText) {
            progressText.textContent = `${appState.assessmentProgress}%`;
        }
        
        // Add log entries at specific progress points
        if (appState.assessmentProgress % 10 === 0 && scanLog) {
            const messageIndex = Math.floor(appState.assessmentProgress / 10) - 1;
            if (messageIndex >= 0 && messageIndex < progressMessages.length) {
                scanLog.innerHTML += `<div class="log-entry">
                    <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                    <span class="message">${progressMessages[messageIndex]}</span>
                </div>`;
                
                // Scroll to bottom of log
                scanLog.scrollTop = scanLog.scrollHeight;
            }
        }
        
        // Complete assessment at 100%
        if (appState.assessmentProgress >= 100) {
            clearInterval(interval);
            
            // Mark assessment as complete
            appState.assessmentComplete = true;
            
            // Enable continue button
            if (continueButton) {
                continueButton.classList.remove('disabled');
                continueButton.classList.add('ready-pulse');
            }
            
            // Final log entry
            if (scanLog) {
                scanLog.innerHTML += `<div class="log-entry highlight">
                    <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                    <span class="message">ASSESSMENT COMPLETE. DASHBOARD READY.</span>
                </div>`;
                
                // Scroll to bottom of log
                scanLog.scrollTop = scanLog.scrollHeight;
            }
            
            console.log('Assessment complete');
        }
    }, 50); // Update every 50ms for faster demo
}

// Try to collect data - will only succeed if dataCollectionActive is true
function attemptDataCollection() {
    // Check if we're authorized to collect data
    if (!appState.dataCollectionActive) {
        console.log('Data collection not active yet - waiting for user to reach dashboard');
        return false;
    }
    
    // If we get here, we're authorized to collect data
    console.log('Data collection is active, proceeding with collection');
    return true;
}

// Start data collection after reaching dashboard
function startDataCollection() {
    // This is only called after reaching the dashboard
    // Double-check we're authorized
    if (!attemptDataCollection()) {
        return;
    }
    
    console.log('Starting comprehensive data collection...');
    
    // Set session identifier
    updateElementValue('session-id-value', generateSessionId());
    
    // Set user information
    updateElementValue('username-value', 'Sentinel User');
    
    // Set location information based on timezone
    updateElementValue('location-value', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown');
    
    // Set timezone
    updateElementValue('timezone-value', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown');
    
    // Set language
    updateElementValue('language-value', navigator.language || 'Unknown');
    
    // Set device type
    updateElementValue('device-type', getDeviceType());
    
    // Set operating system
    updateElementValue('os-value', getOSInfo());
    
    // Set browser information
    updateElementValue('browser-value', getBrowserInfo());
    
    // Set screen resolution
    updateElementValue('screen-value', `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}x`);
    
    // Set viewport
    updateElementValue('viewport-value', `${window.innerWidth}x${window.innerHeight}`);
    
    // Start periodic updates
    startPeriodicUpdates();
    
    // Start collecting dynamic data
    startDynamicDataCollection();
    
    console.log('Initial data collection complete');
}

// Start periodic updates for time-sensitive information
function startPeriodicUpdates() {
    // Check if we're authorized
    if (!appState.dataCollectionActive) {
        return;
    }
    
    // Update time-related elements every second
    setInterval(function() {
        // Double-check we're still authorized
        if (!appState.dataCollectionActive) return;
        
        // Update time on page
        const timeOnPage = document.getElementById('time-on-page');
        if (timeOnPage) {
            const timeInSeconds = Math.round((new Date() - appState.startTime) / 1000);
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            timeOnPage.textContent = `${minutes}m ${seconds}s`;
        }
        
        // Update local time
        updateElementValue('local-time-value', new Date().toLocaleTimeString());
    }, 1000);
}

// Start collecting dynamic data (mouse movement, etc.)
function startDynamicDataCollection() {
    // Only proceed if authorized
    if (!appState.dataCollectionActive) {
        return;
    }
    
    // Track mouse movement
    document.addEventListener('mousemove', function(e) {
        if (!appState.dataCollectionActive) return;
        
        const x = e.clientX;
        const y = e.clientY;
        
        // Update cursor position
        updateElementValue('cursor-position', `${x}, ${y}`);
        
        // Update movement pattern
        const movementEl = document.getElementById('movement-pattern');
        if (movementEl) {
            // Simple movement detection
            const speed = Math.abs(e.movementX) + Math.abs(e.movementY);
            movementEl.textContent = speed > 20 ? 'FAST' : (speed > 5 ? 'NORMAL' : 'SLOW');
        }
    });
    
    // Track scrolling
    document.addEventListener('scroll', function() {
        if (!appState.dataCollectionActive) return;
        
        // Calculate scroll depth as percentage
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const percentage = Math.min(100, Math.round((scrolled / scrollable) * 100)) || 0;
        
        // Update scroll depth
        updateElementValue('scroll-depth', `${percentage}%`);
    });
    
    // Track clicks
    let clickCount = 0;
    document.addEventListener('click', function() {
        if (!appState.dataCollectionActive) return;
        
        clickCount++;
        updateElementValue('click-patterns', `${clickCount} CLICKS`);
    });
}

// Helper function to update element text content
function updateElementValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Helper function to generate a session ID
function generateSessionId() {
    const now = Date.now().toString(16).toUpperCase();
    const random = Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
    return (now.substring(0, 4) + random.substring(0, 4)).padStart(8, '0');
}

// Helper function to detect device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
        return 'Mobile';
    }
    return 'Desktop';
}

// Helper function to detect OS
function getOSInfo() {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Macintosh|Mac OS X/.test(ua)) return 'MacOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Unknown OS';
}

// Helper function to get browser info
function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Edge|Edg/.test(ua)) return 'Edge';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua)) return 'Safari';
    return 'Unknown Browser';
}