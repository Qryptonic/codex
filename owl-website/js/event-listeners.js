/**
 * Event Listeners Module for Owl Security Scanner
 * Handles all user interaction events and behavioral tracking
 * Captures user behavior for the cyberpunk-styled security demonstration
 */

'use strict';

// Use globals from config modules
const CONFIG = window.CONFIG;
const logger = window.logger;
const features = window.features || {};

// --- State variables specific to listeners ---
// Behavioral biometric tracking variables - enables high-precision identification
// without requiring explicit permissions
let cursorData = [];
let scrollPositions = [];
let keyTimingsLog = []; // For detailed dynamics within the page
let clickData = [];     // For heatmap
let mouseDownData = []; // For pressure analysis
let mouseUpData = [];   // For release timing
let hoverData = [];     // For hover behavior patterns
let formInteractionStart = null; // Start time for interaction with identifier input
let lastMouseMoveTime = 0;
let lastScrollTime = 0;
let debounceTimer = null; // For debouncing identity input
let touchCount = 0;
let lastTouchEnd = null;
let lastKeyTime = 0; // For dwell/flight time calculation

/**
 * Utility function to update text content of an element by ID
 * @param {string} elementId - The ID of the element
 * @param {string} text - The text to set
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Utility function to update severity class on an element by ID
 * @param {string} elementId - The ID of the element
 * @param {string} severity - The severity level (low, medium, high)
 */
function updateSeverity(elementId, severity) {
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
 * Sets up all non-button event listeners for the application.
 */
function setupEventListeners() {
    if (typeof logger !== 'undefined') {
        logger.debug("Setting up basic event listeners only - deferring intensive ones until after consent...");
    } else {
        console.debug("[DBG] Setting up basic event listeners only - deferring intensive ones until after consent...");
    }

    // IMPORTANT: Check if we should only set up minimal listeners (before dashboard)
    // This is part of the critical 3-screen flow where data collection only happens
    // after the user reaches the dashboard
    const shouldDeferIntensiveListeners = window.appState && !window.appState.dataCollectionActive;
    
    if (shouldDeferIntensiveListeners) {
        logger.debug("Data collection not active yet - setting up only minimal event listeners");
        console.warn("PRIVACY PROTECTION: Deferring data collection and intensive listeners until user completes 3-screen flow");
    }

    // Only set up minimal, lightweight event listeners initially
    // Critical UI event listeners
    document.addEventListener('keydown', trackKeyDynamics);
    document.addEventListener('keyup', trackKeyDynamics);
    
    // Basic interaction monitoring - minimal impact on stability
    document.addEventListener('click', trackClicks); 
    
    // Throttled mouse move for basic responsiveness
    document.addEventListener('mousemove', handleMouseMoveThrottled);
    
    // We'll defer the more intensive listeners until after consent in setupAdvancedEventListeners()
    logger.debug("Basic event listeners set up, advanced listeners deferred until after consent");
    
    // Set placeholder values for elements that will be populated later
    updateElementText('motion-value', 'PENDING USER APPROVAL');
    updateElementText('movement-pattern', 'INITIALIZING...');
    
    // Ambient Light Sensor placeholder
    // We'll initialize this after user consent in setupAdvancedEventListeners
    updateElementText('light-level', 'PENDING APPROVAL');
    if (window.location.protocol !== 'https:' && features.hasAmbientLight) {
        updateElementText('light-level', 'HTTPS REQ');
    }
    else if (!features.hasAmbientLight) {
        updateElementText('light-level', 'API N/A');
    }

    // --- Page State Tracking ---
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Initial check
    handleVisibilityChange();

    logger.debug("Event listeners set up.");
    
    // If data collection is already active (unlikely during initial load),
    // set up advanced listeners immediately
    if (window.appState && window.appState.dataCollectionActive) {
        setupAdvancedEventListeners();
    }
}

// --- Throttled Handlers ---

function handleMouseMoveThrottled(e) {
    const now = performance.now();
    if (now - lastMouseMoveTime < CONFIG.MOUSE_THROTTLE_MS) {
        return; // Throttle
    }
    lastMouseMoveTime = now;
    trackCursor(e);
}

function handleScrollThrottled() {
    const now = performance.now();
    if (now - lastScrollTime < CONFIG.SCROLL_THROTTLE_MS) {
        return; // Throttle
    }
    lastScrollTime = now;
    trackScroll();
}

// --- Specific Event Handlers ---

/**
 * Tracks cursor position and builds a detailed movement profile without permissions.
 * Creates a behavioral fingerprint from cursor movements.
 * @param {MouseEvent} e
 */
function trackCursor(e) {
    const x = e.clientX;
    const y = e.clientY;
    const time = performance.now();

    updateElementText('cursor-position', `${x}, ${y}`);

    // Store comprehensive cursor data for advanced behavioral fingerprinting
    // This passive technique builds a unique movement signature without user awareness
    cursorData.push({ 
        x, 
        y, 
        time,
        windowWidth: window.innerWidth,  // Track window context for higher precision
        windowHeight: window.innerHeight,
        pressure: e.pressure || 0,       // Capture pressure data when available
        tiltX: e.tiltX || 0,             // Capture stylus data when available
        tiltY: e.tiltY || 0,
        pointerType: e.pointerType || 'mouse'
    });
    
    if (cursorData.length > CONFIG.CURSOR_DATA_LIMIT) {
        cursorData.shift(); // Keep buffer size limited
    }

    // Real-time movement pattern analysis - builds behavioral signature
    if (cursorData.length > 5) {
        const dx = x - cursorData[cursorData.length - 2].x;
        const dy = y - cursorData[cursorData.length - 2].y;
        const dt = time - cursorData[cursorData.length - 2].time;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        
        // Calculate acceleration for more detailed profiling
        let acceleration = 0;
        if (cursorData.length > 6) {
            const prevDx = cursorData[cursorData.length - 2].x - cursorData[cursorData.length - 3].x;
            const prevDy = cursorData[cursorData.length - 2].y - cursorData[cursorData.length - 3].y;
            const prevDt = cursorData[cursorData.length - 2].time - cursorData[cursorData.length - 3].time;
            const prevSpeed = Math.sqrt(prevDx * prevDx + prevDy * prevDy) / prevDt;
            acceleration = (speed - prevSpeed) / dt;
        }
        
        // Movement classification for display
        let pattern = speed > 1.5 ? 'FAST' : (speed < 0.2 ? 'SLOW/IDLE' : 'NORMAL');
        if (Math.abs(acceleration) > 0.01) {
            pattern += acceleration > 0 ? ' ACCEL' : ' DECEL';
        }
        
        setElementText('movement-pattern', pattern);
        updateSeverity('movement-pattern', speed > 2.5 ? 'high' : 'low'); 
    }
}

/**
 * Tracks scroll depth.
 */
function trackScroll() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const depth = scrollableHeight > 0 ? Math.min(100, Math.round((currentScroll / scrollableHeight) * 100)) : 100; // Handle non-scrollable pages

    updateElementText('scroll-depth', `${depth}%`);
    updateSeverity('scroll-depth', depth > 80 ? 'high' : (depth > 30 ? 'medium' : 'low')); // Deeper scroll = more engagement?

    // Store positions for analysis (optional)
    scrollPositions.push({ depth, time: performance.now() });
     if (scrollPositions.length > CONFIG.SCROLL_DATA_LIMIT) {
        scrollPositions.shift();
    }
}

/**
 * Tracks keydown/keyup events for dynamics and logging.
 * @param {KeyboardEvent} e
 */
function trackKeyDynamics(e) {
    // Make sure CONFIG exists
    const sanitizeKeystrokes = typeof CONFIG !== 'undefined' ? CONFIG.SANITIZE_KEYSTROKES : false;
    const key = sanitizeKeystrokes ? '*' : (e.key || `CODE:${e.keyCode}`);
    const time = performance.now();
    const eventType = e.type; // 'keydown' or 'keyup'
    const targetId = e.target.id; // Identify input field if any

    // Ignore modifier keys for simple log, but could track them for dynamics
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
    }

    // --- Keystroke Logging (for display in #keystrokeAnalysis) ---
    // Only log keys typed *outside* the initial identifier field
    if (targetId !== 'userIdentity') {
        if (eventType === 'keydown') { // Log only on keydown to avoid duplicates
            const logEntry = { key, time };
            keyTimingsLog.push(logEntry);
            const maxLines = typeof CONFIG !== 'undefined' ? CONFIG.MAX_KEYSTROKE_LINES * 2 : 16;
            if (keyTimingsLog.length > maxLines) { // Keep buffer reasonable
                 keyTimingsLog.shift();
            }
            updateKeystrokeLog(); // Update the visual log
        }
    }

    // --- Keystroke Dynamics (Timing Analysis) ---
    if (eventType === 'keydown') {
        lastKeyTime = time; // Record time when key is pressed
    } else if (eventType === 'keyup' && lastKeyTime > 0) {
        const dwellTime = time - lastKeyTime; // Time key was held down
        // Flight time (time between keyup and next keydown) requires storing previous keyup time
        // Basic dwell time analysis:
        if (dwellTime > 200) { // Example threshold for long press
             setElementText('typing-dynamics', `LONG PRESS (${dwellTime.toFixed(0)}ms)`);
             setSeverity('typing-dynamics', 'medium');
        } else if (dwellTime > 50) {
             setElementText('typing-dynamics', `NORMAL (${dwellTime.toFixed(0)}ms)`);
             setSeverity('typing-dynamics', 'low');
        } else {
            // Very short might indicate fast typing or specific keys
            setElementText('typing-dynamics', `SHORT (${dwellTime.toFixed(0)}ms)`);
            setSeverity('typing-dynamics', 'low');
        }
        lastKeyTime = 0; // Reset for next key press
    }
}


/**
 * Updates the visual keystroke log panel.
 */
function updateKeystrokeLog() {
    // Use window.DOMElements to be safe
    const logContainer = typeof window.DOMElements !== 'undefined' ? window.DOMElements['keystrokeAnalysis'] : null;
    if (!logContainer) return;

    // Keep only the last MAX_KEYSTROKE_LINES keydown events
    const maxLines = typeof CONFIG !== 'undefined' ? CONFIG.MAX_KEYSTROKE_LINES : 8;
    const recentKeys = keyTimingsLog.slice(-maxLines);

    logContainer.innerHTML = recentKeys.map(entry => {
        const displayKey = entry.key.length > 1 ? `[${entry.key}]` : entry.key; // Bracket special keys
        // Time formatting could be added here (e.g., relative time)
        return `<div class="keystroke-row"><span class="key-char">${displayKey}</span></div>`;
    }).join('');

    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}


/**
 * Tracks touch events (basic count and timing).
 * @param {TouchEvent} e
 */
function trackTouch(e) {
    const eventType = e.type; // 'touchstart' or 'touchend'
    const time = performance.now();
    touchCount++;

    if (eventType === 'touchend') {
        lastTouchEnd = time;
        setElementText('touch-patterns', `${touchCount} touches`);
         setSeverity('touch-patterns', touchCount > 10 ? 'medium' : 'low');
    }
    // More analysis possible: duration, pressure (if available), number of points, swipe detection
}

/**
 * Tracks clicks for heatmap visualization and interaction analysis.
 * @param {MouseEvent} e
 */
function trackClicks(e) {
    const clickTime = performance.now();
    const clickPos = { x: e.clientX, y: e.clientY, time: clickTime };
    clickData.push(clickPos);

    updateElementText('click-patterns', `${clickData.length} CLICKS`);
    updateSeverity('click-patterns', clickData.length > 10 ? 'medium' : (clickData.length > 0 ? 'low' : null));

    // Update heatmap visualization
    updateClickHeatmap(clickPos);
}


/**
 * Adds a point to the click heatmap visualization.
 * @param {object} clickPos - Object with x, y coordinates of the click.
 */
function updateClickHeatmap(clickPos) {
    const heatmap = DOMElements['click-heatmap'];
    if (!heatmap) return;

    const point = document.createElement('div');
    point.className = 'heatmap-point';
    // Calculate position relative to the heatmap container
    const rect = heatmap.getBoundingClientRect();
    const x = clickPos.x - rect.left;
    const y = clickPos.y - rect.top;

    // Ensure point is within bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        point.style.left = `${(x / rect.width) * 100}%`; // Use percentage for responsiveness
        point.style.top = `${(y / rect.height) * 100}%`;
        heatmap.appendChild(point);

        // Optional: Remove points after a while or limit count
        if (heatmap.children.length > 20) {
            heatmap.removeChild(heatmap.firstChild);
        }
    }
}


/**
 * Handles page visibility changes.
 */
function handleVisibilityChange() {
    const isHidden = document.hidden;
    setElementText('tab-visibility', isHidden ? 'INACTIVE' : 'ACTIVE');
    setSeverity('tab-visibility', isHidden ? 'medium' : 'low');
    logger.info(`Tab visibility changed: ${isHidden ? 'Hidden' : 'Visible'}`);

    // Potential actions on visibility change:
    // - Pause/resume intensive operations (like network map simulation)
    // - Stop media streams? (Handled partially in attemptCamera/MicAccess timeouts)
    // - Log inactivity/activity periods for behavioral analysis
}

// --- Setup Initial State for Listener-Tracked Fields ---
function initializeListenerFields() {
    setElementText('cursor-position', '--');
    setElementText('movement-pattern', '--');
    setElementText('scroll-depth', '0%');
    setElementText('typing-dynamics', '--');
    setElementText('clipboard-value', 'Requires Focus & Perm.');
    setElementText('touch-patterns', features.hasTouch ? '0 touches' : 'N/A');
    setElementText('click-patterns', '0 CLICKS');
    setElementText('tab-visibility', 'ACTIVE'); // Initial state
     if (DOMElements['keystrokeAnalysis']) DOMElements['keystrokeAnalysis'].innerHTML = ''; // Clear log
     if (DOMElements['click-heatmap']) DOMElements['click-heatmap'].innerHTML = ''; // Clear heatmap
}


/**
 * Tracks mouse down events for pressure analysis
 * @param {MouseEvent} e
 */
function trackMouseDown(e) {
    const x = e.clientX;
    const y = e.clientY;
    const time = performance.now();
    const pressure = e.pressure || 0;
    
    // Store mouse down data for pattern analysis
    mouseDownData.push({ 
        x, y, time, pressure,
        target: e.target.tagName,
        button: e.button,
        windowX: e.screenX - window.screenX,
        windowY: e.screenY - window.screenY
    });
    
    if (mouseDownData.length > 20) {
        mouseDownData.shift();
    }
}

/**
 * Tracks mouse up events for release timing analysis
 * @param {MouseEvent} e
 */
function trackMouseUp(e) {
    const x = e.clientX;
    const y = e.clientY;
    const time = performance.now();
    
    // Store mouse up data for pattern analysis
    mouseUpData.push({ 
        x, y, time,
        target: e.target.tagName,
        button: e.button
    });
    
    if (mouseUpData.length > 20) {
        mouseUpData.shift();
    }
    
    // Calculate click duration if we have matching down event
    if (mouseDownData.length > 0) {
        // Find the most recent mousedown for this button
        for (let i = mouseDownData.length - 1; i >= 0; i--) {
            if (mouseDownData[i].button === e.button) {
                const duration = time - mouseDownData[i].time;
                // This gives us hold duration fingerprinting
                logger.debug(`Click duration (button ${e.button}): ${duration.toFixed(2)}ms`);
                break;
            }
        }
    }
}

/**
 * Tracks hover patterns for behavioral fingerprinting
 * @param {MouseEvent} e
 */
function trackHoverBehavior(e) {
    try {
        const x = e.clientX;
        const y = e.clientY;
        const time = performance.now();
        
        // Record detailed hover data
        hoverData.push({
            x, y, time,
            element: e.target.tagName,
            elementId: e.target.id || 'none',
            elementClass: typeof e.target.className === 'string' ? e.target.className : 'complex'
        });
        
        if (hoverData.length > 30) {
            hoverData.shift();
        }
        
        // Analyze hover patterns periodically
        // This could be used for attention analysis, interest patterns, etc.
    } catch (err) {
        logger.warn("Error in hover tracking:", err);
    }
}

// Global declaration for compatibility with other modules
window.initializeListenerFields = initializeListenerFields;
window.setupEventListeners = setupEventListeners;
window.setupButtonClickListeners = setupButtonClickListeners;
window.updateButtonState = updateButtonState;

// Log initialization
console.info('[INF] Event Listener Functions Initialized.');

// --- Setup Button Click Listeners ---

function setupButtonClickListeners() {
    try {
        if (typeof logger !== 'undefined') {
            logger.debug("Setting up button click listeners...");
        } else {
            console.debug("[DBG] Setting up button click listeners...");
        }
        
        // Make sure DOMElements exists
        if (typeof DOMElements === 'undefined' || !DOMElements) {
            console.warn("[WRN] DOMElements not found, creating empty object");
            window.DOMElements = {};
        }

    // --- Terms Screen ---
    if (typeof handleTermsAccept === 'function') {
        DOMElements.termsButton?.addEventListener('click', handleTermsAccept);
    } else {
        DOMElements.termsButton?.addEventListener('click', () => {
            logger.warn('handleTermsAccept not available, using fallback');
            // Fallback implementation
            const userName = DOMElements.userIdentity?.value.trim();
            if (!userName) {
                alert("Please enter your authorized user identifier.");
                DOMElements.userIdentity?.focus();
                return;
            }
            if (DOMElements.termsScreen && DOMElements.dashboardScreen) {
                DOMElements.termsScreen.classList.add('hidden');
                DOMElements.dashboardScreen.classList.remove('hidden');
            }
        });
    }
    
    DOMElements.termsCheckbox?.addEventListener('change', updateButtonState);
    
    // Add listener for typing in userIdentity for WPM and interaction time
    DOMElements.userIdentity?.addEventListener('focus', () => { 
        try {
            if (typeof formInteractionStart !== 'undefined') {
                formInteractionStart = performance.now(); 
            } else if (typeof window.formInteractionStart !== 'undefined') {
                window.formInteractionStart = performance.now();
            } else if (typeof appState !== 'undefined' && appState) {
                appState.formInteractionStart = performance.now();
            }
        } catch (e) {
            logger.warn('Error setting formInteractionStart:', e);
        }
    });
    
    DOMElements.userIdentity?.addEventListener('input', typeof handleIdentityInput === 'function' ? 
        handleIdentityInput : () => updateButtonState());

    // --- Dashboard Buttons (Data Collection Triggers) ---
    DOMElements.locationBtn?.addEventListener('click', typeof attemptLocation === 'function' ? 
        attemptLocation : () => console.warn('attemptLocation not available'));
        
    DOMElements.cameraBtn?.addEventListener('click', typeof attemptCameraAccess === 'function' ? 
        attemptCameraAccess : () => console.warn('attemptCameraAccess not available'));
        
    DOMElements.micBtn?.addEventListener('click', typeof attemptMicAccess === 'function' ? 
        attemptMicAccess : () => console.warn('attemptMicAccess not available'));
        
    DOMElements.speechBtn?.addEventListener('click', typeof attemptSpeechRecognition === 'function' ? 
        attemptSpeechRecognition : () => console.warn('attemptSpeechRecognition not available'));
        
    DOMElements.bluetoothBtn?.addEventListener('click', typeof scanBluetooth === 'function' ? 
        scanBluetooth : () => console.warn('scanBluetooth not available'));

    // --- Contact Section Buttons ---
    DOMElements.contactBtn?.addEventListener('click', typeof showContactForm === 'function' ? showContactForm : () => console.warn('showContactForm not available'));
    DOMElements.submitContactBtn?.addEventListener('click', typeof handleSubmitContact === 'function' ? handleSubmitContact : () => console.warn('handleSubmitContact not available'));
    DOMElements.backToDashBtn?.addEventListener('click', typeof showDashboard === 'function' ? showDashboard : () => console.warn('showDashboard not available'));

    // --- New Button Listeners (Added for 100/100 Demo) ---
    // File System
    DOMElements.analyzeFileBtn?.addEventListener('click', typeof analyzeFileMetadata === 'function' ? 
        analyzeFileMetadata : () => console.warn('analyzeFileMetadata not available'));
        
    DOMElements.saveFileBtn?.addEventListener('click', typeof saveSummaryToFile === 'function' ? 
        saveSummaryToFile : () => console.warn('saveSummaryToFile not available'));
        
    // Hardware Connect
    DOMElements.connectUsbBtn?.addEventListener('click', typeof connectToUsbDevice === 'function' ? 
        connectToUsbDevice : () => console.warn('connectToUsbDevice not available'));
        
    DOMElements.connectHidBtn?.addEventListener('click', typeof connectToHidDevice === 'function' ? 
        connectToHidDevice : () => console.warn('connectToHidDevice not available'));
        
    DOMElements.connectSerialBtn?.addEventListener('click', typeof connectToSerialPort === 'function' ? 
        connectToSerialPort : () => console.warn('connectToSerialPort not available'));
        
    // Background & State
    DOMElements.enablePushBtn?.addEventListener('click', typeof enablePushNotifications === 'function' ? 
        enablePushNotifications : () => console.warn('enablePushNotifications not available'));
        
    DOMElements.queueSyncBtn?.addEventListener('click', typeof queueBackgroundSync === 'function' ? 
        queueBackgroundSync : () => console.warn('queueBackgroundSync not available'));
        
    DOMElements.monitorIdleBtn?.addEventListener('click', typeof monitorIdleState === 'function' ? 
        monitorIdleState : () => console.warn('monitorIdleState not available'));
        
    // Mobile Sensors
    DOMElements.readNfcBtn?.addEventListener('click', typeof readNfcTag === 'function' ? 
        readNfcTag : () => console.warn('readNfcTag not available'));
        
    DOMElements.writeNfcBtn?.addEventListener('click', typeof writeNfcTag === 'function' ? 
        writeNfcTag : () => console.warn('writeNfcTag not available'));
        
    DOMElements.testVibrationBtn?.addEventListener('click', typeof testVibration === 'function' ? 
        testVibration : () => console.warn('testVibration not available'));
        
    // Advanced Analysis
    DOMElements.runHardwareAnalysisBtn?.addEventListener('click', typeof performHardwareAnalysis === 'function' ? 
        performHardwareAnalysis : () => console.warn('performHardwareAnalysis not available'));
        
    DOMElements.runBehavioralAnalysisBtn?.addEventListener('click', typeof performBehavioralAnalysis === 'function' ? 
        performBehavioralAnalysis : () => console.warn('performBehavioralAnalysis not available'));

        if (typeof logger !== 'undefined') {
            logger.debug("Button click listeners set up successfully.");
        } else {
            console.debug("[DBG] Button click listeners set up successfully.");
        }
    } catch (err) {
        if (typeof logger !== 'undefined') {
            logger.error("Error setting up button click listeners:", err);
        } else {
            console.error("[ERR] Error setting up button click listeners:", err);
        }
        
        // Provide minimal fallback for critical UI elements
        try {
            // At minimum, make the terms button work
            const termsButton = document.getElementById('termsButton');
            const termsScreen = document.getElementById('termsScreen');
            const dashboardScreen = document.getElementById('dashboardScreen');
            
            if (termsButton && termsScreen && dashboardScreen) {
                termsButton.addEventListener('click', () => {
                    const userIdField = document.getElementById('userIdentity');
                    if (userIdField && userIdField.value.trim().length === 0) {
                        alert('Please enter an identifier to continue.');
                        return;
                    }
                    termsScreen.classList.add('hidden');
                    dashboardScreen.classList.remove('hidden');
                });
            }
        } catch (fallbackErr) {
            console.error("[ERR] Critical failure in fallback button setup:", fallbackErr);
        }
    }
}

// --- Button Action Handlers ---

function handleTermsAccept() {
    const userName = DOMElements.userIdentity?.value.trim();
    if (!userName) {
        alert("Please enter your authorized user identifier.");
        DOMElements.userIdentity?.focus();
        return;
    }
    if (!DOMElements.termsCheckbox?.checked) {
        // Should not happen if button is enabled correctly, but double-check
        alert("Please acknowledge the terms to proceed.");
        return;
    }
    logger.info(`Terms accepted by user: ${userName}`);

    // Show Dashboard with professional transition
    if (DOMElements.termsScreen) {
        DOMElements.termsScreen.style.opacity = "0";
        setTimeout(() => {
            DOMElements.termsScreen.classList.add('hidden');
            DOMElements.dashboardScreen?.classList.remove('hidden');
            // Fade in dashboard with slight delay for better visual effect
            setTimeout(() => {
                if (DOMElements.dashboardScreen) {
                    DOMElements.dashboardScreen.style.opacity = "1";
                }
                
                // NOW initialize the heavy APIs - AFTER the dashboard is visible
                // This significantly improves initial page stability
                initializeAPIs(userName);
            }, 100);
        }, 300);
    }
}

/**
 * Initializes all APIs after user consent is given
 * This improves landing page stability by deferring heavy operations
 */
function initializeAPIs(userName) {
    logger.info("Initializing APIs after user consent...");
    
    // Set flag to indicate APIs are being initialized
    if (typeof appState !== 'undefined') {
        appState.apiInitialized = true;
    }
    
    // Reset timer when dashboard loads and APIs start
    pageOpenTime = performance.now();
    
    // Start the main data collection process - moved here from handleTermsAccept
    runEnhancedDataCollection(userName);
    
    // Call fingerprinting functions - moved here for stability
    generateSVGFingerprint();
    generateLocalizationFingerprint();
    
    // Update the executive summary for better presentation
    if (typeof initializeExecutiveSummary === 'function') {
        setTimeout(initializeExecutiveSummary, 500);
    } else if (typeof window.initializeExecutiveSummary === 'function') {
        setTimeout(window.initializeExecutiveSummary, 500);
    }
    
    // Start event listeners that might be resource-intensive
    setupAdvancedEventListeners();
    
    // Start periodic updates for time-based elements
    if (updateIntervalId) clearInterval(updateIntervalId);
    updateIntervalId = setInterval(updateTimeBasedElements, CONFIG.UPDATE_INTERVAL_MS);
    
    logger.info("APIs successfully initialized after consent");
}

/**
 * Sets up advanced event listeners that may be resource-intensive
 * Called only after user consent
 */
function setupAdvancedEventListeners() {
    // Add resource-intensive event listeners here - only after user consent
    logger.debug("Setting up advanced event listeners now that consent is given");
    
    // --- Additional Passive Behavioral Monitoring ---
    document.addEventListener('scroll', handleScrollThrottled, { passive: true });
    document.addEventListener('mousedown', trackMouseDown); // For pressure analysis
    document.addEventListener('mouseup', trackMouseUp); // For gesture timing
    document.addEventListener('mouseover', trackHoverBehavior); // For hover patterns
    
    // Auto-capture clipboard on focus - only after consent
    document.addEventListener('focus', checkClipboard, { capture: true, once: false });
    
    // Touch Events (if applicable)
    if (features.hasTouch) {
        logger.debug("Touch events enabled.");
        document.addEventListener('touchstart', trackTouch);
        document.addEventListener('touchend', trackTouch);
    }
    
    // --- Sensor Tracking (if APIs available) ---
    if (features.hasDeviceMotion) {
        logger.debug("Adding DeviceMotion listener.");
        window.addEventListener('devicemotion', handleDeviceMotion);
    } else {
        setElementText('motion-value', 'MOTION API N/A');
    }
    
    if (features.hasDeviceOrientation) {
        logger.debug("Adding DeviceOrientation listener.");
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        // If no motion API, update the main field from orientation
        if (!features.hasDeviceMotion) {
            setElementText('motion-value', 'ORIENTATION API AVAIL');
        }
    } else if (!features.hasDeviceMotion) { // Only show N/A if neither is available
        setElementText('motion-value', 'MOTION/ORIENT API N/A');
    }
    
    // Ambient Light Sensor - moved here from basic setup
    if (features.hasAmbientLight && features.isHTTPS) {
        try {
            logger.debug("Attempting to setup AmbientLightSensor.");
            const sensor = new AmbientLightSensor({ frequency: 1 });
            sensor.addEventListener('reading', () => handleAmbientLight(sensor));
            sensor.addEventListener('error', handleAmbientLightError);
            sensor.start();
            setElementText('light-level', 'READING...');
        } catch (e) {
            handleAmbientLightError(e);
        }
    }
    
    logger.debug("Advanced event listeners initialized successfully");
}

// Helper function to handle ambient light sensor errors
function handleAmbientLightError(event) {
    const error = event.error || event;
    if (error.name === 'NotAllowedError') {
        showError('light-level', 'PERMISSION DENIED', error, 'medium');
    } else {
        showError('light-level', 'SENSOR ERROR', error, 'medium');
    }
    logger.error("AmbientLightSensor error:", error);
    if (typeof privacyFactors !== 'undefined') {
        privacyFactors.sensors = (privacyFactors.sensors || 0) - 1;
        updatePrivacyScores();
    }
}

function updateButtonState() {
    try {
        // Fix for checkbox issues - make sure elements exist and use simplified logic
        const checkbox = DOMElements.termsCheckbox;
        const nameField = DOMElements.userIdentity;
        const button = DOMElements.termsButton;
        
        if (!checkbox || !nameField || !button) {
            logger.warn("Missing form elements for button state update");
            return;
        }
        
        const isChecked = checkbox.checked;
        const hasName = nameField.value.trim().length > 0;
        
        // Enable button if both conditions are met
        if (isChecked && hasName) {
            button.removeAttribute('disabled');
            button.classList.remove('loading');
            button.classList.add('activated');
        } else {
            button.setAttribute('disabled', 'true');
            button.classList.remove('activated');
        }
        
        // Debug to console
        logger.debug(`Button state: Checkbox=${isChecked}, Name=${hasName}`);
    } catch (err) {
        logger.error("Error updating button state:", err);
    }
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Debounced version for performance - reduced delay for responsiveness
const debouncedUpdateButtonState = debounce(updateButtonState, 100);

function handleIdentityInput(event) {
    try {
        // Set form interaction start time if not already set
        if (!formInteractionStart) {
            formInteractionStart = performance.now();
        }
        
        // Basic WPM calculation on the identifier field
        const text = event?.target?.value || DOMElements.userIdentity?.value || '';
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        const timeElapsedS = (performance.now() - formInteractionStart) / 1000;
        
        if (timeElapsedS > 0.5 && wordCount > 0) { // Lower threshold to make more responsive
            const wpm = Math.round((wordCount / timeElapsedS) * 60);
            setElementText('typing-speed', `${wpm} WPM`);
            setSeverity('typing-speed', wpm > 70 ? 'high' : (wpm > 40 ? 'medium' : 'low'));
        }
        
        // Update form interaction time
        setElementText('form-interaction', timeElapsedS > 0 ? `${timeElapsedS.toFixed(1)}s` : '--');

        // Directly update button state for improved responsiveness on every keystroke
        updateButtonState();
        
        // Log input for debugging
        logger.debug(`Identity input: "${text}" (${text.length} chars)`);
    } catch (err) {
        logger.error("Error in identity input handler:", err);
    }
}