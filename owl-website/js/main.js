/**
 * Main Application Script
 * Initializes the Owl Security Scanner application
 */

'use strict';

console.log('Main module loading...');

// Create a global cache if not created in index.html
window.DOMElements = window.DOMElements || {};
window.pageOpenTime = window.pageOpenTime || performance.now();

// Create app state if not already defined to control data collection
window.appState = window.appState || {
    currentScreen: 'landing',
    dataCollectionActive: false, // This ensures data collection doesn't happen without consent
    assessmentProgress: 0,
    assessmentComplete: false,
    startTime: new Date()
};

// Global helper function for enterprise error reporting across modules
window.reportEnterpriseError = function(message, severity = 'high', context = 'SYSTEM') {
    if (window.errorTracker && typeof window.errorTracker.trackError === 'function') {
        window.errorTracker.trackError(message, context);
        
        // Update indicator severity if it exists
        const indicator = document.getElementById('error-indicator');
        if (indicator) {
            indicator.setAttribute('data-severity', severity);
        }
        
        console.error(`[${severity.toUpperCase()}] ${message}`);
    } else {
        console.error(`[${severity.toUpperCase()}] ${message}`);
    }
    return false; // Allows this to be used in error handling chains
};

// Enterprise Error Tracking System - Make globally accessible
window.errorTracker = {
    errors: [],
    maxErrors: 15,
    
    init() {
        // Create error tracking UI
        const errorTracking = document.createElement('div');
        errorTracking.className = 'error-tracking';
        errorTracking.innerHTML = `
            <div class="error-tracking-header">
                <span>SYSTEM ERROR MONITORING</span>
                <button id="close-error-tracking">×</button>
            </div>
            <div id="error-entries"></div>
        `;
        document.body.appendChild(errorTracking);
        
        // Setup close button
        document.getElementById('close-error-tracking').addEventListener('click', () => {
            errorTracking.classList.remove('active');
        });
        
        // Create a visual error indicator for quick notification
        const errorIndicator = document.createElement('div');
        errorIndicator.id = 'error-indicator';
        errorIndicator.className = 'error-indicator';
        errorIndicator.innerHTML = `<span class="error-icon">!</span>`;
        errorIndicator.title = 'System errors detected';
        
        // Add click event to show error tracking window
        errorIndicator.addEventListener('click', () => {
            errorTracking.classList.add('active');
        });
        
        document.body.appendChild(errorIndicator);
        
        // Override console.error to track errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.trackError(args.join(' '));
            originalConsoleError.apply(console, args);
        };
        
        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.trackError(event.message, event.filename, event.lineno);
            return false;
        });
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(`Promise Rejection: ${event.reason}`, 'async');
            return false;
        });
    },
    
    trackError(message, context = 'script', line = '') {
        const timestamp = new Date().toISOString();
        const error = { timestamp, message, context, line };
        
        this.errors.unshift(error);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
        }
        
        this.updateUI();
        
        // Show the error indicator
        const errorIndicator = document.getElementById('error-indicator');
        if (errorIndicator) {
            errorIndicator.classList.add('active');
        }
    },
    
    updateUI() {
        const errorEntries = document.getElementById('error-entries');
        const errorTracking = document.querySelector('.error-tracking');
        
        if (errorEntries && errorTracking) {
            errorTracking.classList.add('active');
            
            errorEntries.innerHTML = this.errors.map(error => `
                <div class="error-entry">
                    <div class="error-timestamp">${error.timestamp}</div>
                    <div class="error-message">${error.message}</div>
                    <div class="error-context">${error.context}${error.line ? `:${error.line}` : ''}</div>
                </div>
            `).join('');
        }
    },
    
    clear() {
        this.errors = [];
        this.updateUI();
        
        // Hide the error indicator
        const errorIndicator = document.getElementById('error-indicator');
        if (errorIndicator) {
            errorIndicator.classList.remove('active');
        }
    }
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Main] DOM fully loaded, starting main initialization...');
    
    try {
        // Initialize error tracking system
        errorTracker.init();
        console.log('[Main] Enterprise error tracking system initialized.');
        
        // 1. Initialize the DOM element cache first
        console.log('[Main] Calling initDOMElements...');
        initDOMElements();
        console.log('[Main] initDOMElements finished.');
        
        // 2. Set up UI Events that don't depend on other modules
        console.log('[Main] Calling setupCoreUIEvents...');
        setupCoreUIEvents();
        console.log('[Main] setupCoreUIEvents finished.');
        
        // 3. Check HTTPS
        console.log('[Main] Calling checkHTTPS...');
        checkHTTPS();
        console.log('[Main] checkHTTPS finished.');
        
        // 4. Set up periodic UI updates
        console.log('[Main] Calling setupPeriodicUpdates...');
        setupPeriodicUpdates();
        console.log('[Main] setupPeriodicUpdates finished.');
        
        // 5. Set up event listeners from event-listeners.js if available
        if (typeof window.setupEventListeners === 'function') {
            console.log('[Main] Setting up event listeners from external module...');
            window.setupEventListeners();
        }
        
        // 6. Setup button click listeners if available
        if (typeof window.setupButtonClickListeners === 'function') {
            console.log('[Main] Setting up button click listeners from external module...');
            window.setupButtonClickListeners();
        }
        
        // 7. Add enterprise grade landing page enhancements
        enhanceLandingPage();
        
        // 8. Initialize performance improvements
        initPerformanceOptimizations();
        
        // 9. Dispatch event to signal core setup is complete
        console.log('[Main] Core setup complete. Dispatching appInitialized event...');
        window.dispatchEvent(new CustomEvent('appInitialized'));
        console.log('[Main] appInitialized event dispatched.');
        
    } catch (error) {
        console.error('[Main] CRITICAL ERROR during initialization:', error);
        // Display error message on the page
        const body = document.querySelector('body');
        if (body) {
            // Use template literals for cleaner HTML string construction
            body.innerHTML = `
                <h1 style="color: red; font-family: sans-serif;">Initialization Error</h1>
                <p style="font-family: sans-serif;">A critical error occurred during startup. Check the console.</p>
                <pre style="color: white; background: #333; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word;">${error.stack || error}</pre>
            `;
        }
    }
    
    console.log('[Main] Main initialization sequence finished.');
});

/**
 * Add enterprise-grade enhancements to landing page
 */
/**
 * Enhances the landing page with enterprise-grade UI elements
 */
function enhanceLandingPage() {
    // Add corner accents to auth container
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        // Add bottom-right corner accent
        const cornerBR = document.createElement('div');
        cornerBR.className = 'corner-br';
        authContainer.appendChild(cornerBR);
        
        // Add enterprise security badges
        const enterpriseBadges = document.createElement('div');
        enterpriseBadges.className = 'enterprise-badges';
        enterpriseBadges.innerHTML = `
            <div class="enterprise-badge">ISO 27001</div>
            <div class="enterprise-badge">SOC 2</div>
            <div class="enterprise-badge">NIST CSF</div>
            <div class="enterprise-badge" id="test-error-btn" title="Test the enterprise error tracking system">TEST ERRORS</div>
        `;
        authContainer.appendChild(enterpriseBadges);
        
        // Add click event for error test button
        document.getElementById('test-error-btn')?.addEventListener('click', function() {
            if (typeof window.testEnterpriseErrorTracking === 'function') {
                window.testEnterpriseErrorTracking();
                this.textContent = 'ERRORS TRIGGERED';
            }
        });
        
        // Add animated pulse effect
        authContainer.style.animation = 'containerPulse 4s infinite alternate';
    }
    
    // Apply enterprise terminal style to disclaimer
    const disclaimerContent = document.querySelector('.disclaimer-content');
    if (disclaimerContent) {
        disclaimerContent.classList.add('enterprise-terminal');
        
        // Add simulated terminal header
        const terminalHeader = document.createElement('div');
        terminalHeader.className = 'terminal-header';
        terminalHeader.innerHTML = `
            <span class="terminal-title">SECURE DISCLOSURE TERMINAL // OWL ADVISORY GROUP</span>
            <div class="terminal-controls">
                <span class="terminal-circle"></span>
                <span class="terminal-circle"></span>
                <span class="terminal-circle"></span>
            </div>
        `;
        disclaimerContent.parentNode.insertBefore(terminalHeader, disclaimerContent);
        
        // Add encryption indicator
        const encIndicator = document.createElement('div');
        encIndicator.className = 'encryption-indicator';
        encIndicator.innerHTML = `<span class="encryption-dot"></span> ENCRYPTED CHANNEL: TLS 1.3 / AES-256-GCM`;
        disclaimerContent.parentNode.insertBefore(encIndicator, disclaimerContent.nextSibling);
    }
    
    // Add more cyberpunk styling to the auth header
    const authHeader = document.querySelector('.auth-header');
    if (authHeader) {
        authHeader.classList.add('cyberpunk-header');
        authHeader.innerHTML = `<span class="glitch-text" data-text="OWL ADVISORY GROUP">OWL ADVISORY GROUP</span><span class="blink-text">_</span>`;
    }
    
    // Improve disclaimer content readability
    const disclaimerParagraphs = document.querySelectorAll('.disclaimer-content p');
    disclaimerParagraphs.forEach(paragraph => {
        paragraph.style.marginBottom = '15px';
        paragraph.style.lineHeight = '1.5';
    });
    
    // Enhance form elements
    const userIdentityInput = document.getElementById('userIdentity');
    if (userIdentityInput) {
        userIdentityInput.placeholder = 'Enter your name or corporate identifier';
    }
    
    // Add loading indicator for dashboard transition
    const termsButton = document.getElementById('termsButton');
    if (termsButton) {
        termsButton.addEventListener('click', function() {
            if (!this.disabled) {
                this.innerHTML = '<span>INITIALIZING ASSESSMENT</span> <span class="loading-indicator"></span>';
            }
        }, { once: true });
    }
}

/**
 * Initializes performance optimizations for the application
 */
function initPerformanceOptimizations() {
    console.log('[Main] Initializing performance optimizations...');
    
    // Lazy load images that are not in initial viewport
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (lazyImages.length > 0) {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    // Initialize Web Workers if available
    if (window.Worker && window.modules && window.modules.workerHelper) {
        // Pre-initialize worker for faster startup when needed
        try {
            console.log('[Main] Pre-initializing Web Worker for performance...');
            const workerHelper = window.modules.workerHelper.getWorkerHelper();
            if (workerHelper && typeof workerHelper.init === 'function') {
                workerHelper.init().then(() => {
                    console.log('[Main] Web Worker pre-initialized successfully');
                }).catch(err => {
                    console.warn('[Main] Web Worker pre-initialization warning:', err);
                });
            }
        } catch (error) {
            console.warn('[Main] Web Worker pre-initialization failed:', error);
        }
    }
    
    // Optimize animations for performance
    if ('requestAnimationFrame' in window) {
        const animatedElements = document.querySelectorAll('.scan-pulse, .glitch-text, [data-animation]');
        if (animatedElements.length > 0) {
            console.log('[Main] Optimizing animations with requestAnimationFrame');
            
            // Group animations to minimize repaints
            window.requestAnimationFrame(() => {
                animatedElements.forEach(el => {
                    el.style.willChange = 'opacity, transform';
                });
            });
        }
    }
    
    // Initialize throttled event handlers
    initThrottledEvents();
    
    console.log('[Main] Performance optimizations complete');
}

/**
 * Initializes throttled event handlers for better performance
 */
function initThrottledEvents() {
    // Throttle function to limit event firing
    const throttle = (func, limit) => {
        let lastFunc, lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    };
    
    // Throttled resize handler
    const throttledResize = throttle(() => {
        // Update responsive elements
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Update viewport display if element exists
        const viewportValueEl = document.getElementById('viewport-value');
        if (viewportValueEl) {
            viewportValueEl.textContent = `${viewport.width}×${viewport.height}`;
        }
    }, 200);
    
    // Throttled scroll handler
    const throttledScroll = throttle(() => {
        // Update scroll depth if element exists
        const scrollDepthEl = document.getElementById('scroll-depth');
        if (scrollDepthEl) {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            
            const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
            scrollDepthEl.textContent = isNaN(scrollPercentage) ? '0%' : `${Math.min(100, Math.max(0, scrollPercentage))}%`;
        }
    }, 200);
    
    // Add event listeners
    window.addEventListener('resize', throttledResize);
    window.addEventListener('scroll', throttledScroll);
    
    // Initial calls
    throttledResize();
    throttledScroll();
}

/**
 * Cache important DOM elements for quick access
 */
function initDOMElements() {
    console.log('Initializing DOM element cache...');
    
    // Use the initializeDOMCache function from config.js if available
    if (typeof window.initializeDOMCache === 'function') {
        window.initializeDOMCache();
        return;
    }
    
    // User interface elements - basic elements to get started
    const elementIds = [
        // Main screens
        'termsScreen', 'dashboardScreen', 'contact-section',
        
        // User inputs
        'userIdentity', 'termsCheckbox', 'termsButton',
        
        // Header elements
        'username-value', 'session-id-value',
        
        // Data display elements
        'battery-text', 'battery-fill', 'battery-rate',
        'gpu-value', 'js-performance', 'gpu-perf-value',
        'cursor-position', 'scroll-depth', 'keystrokeAnalysis',
        'movement-pattern', 'typing-dynamics', 'click-patterns', 'touch-patterns',
        'privacy-score', 'tracking-score', 'identity-score',
        'leakage-score', 'exposed-data', 'trackers-value',
        'overall-risk-value', 'summary-identity-exposure', 'summary-tracking-potential',
        'summary-endpoint-vulnerability', 'identity-gauge', 'tracking-gauge', 'endpoint-gauge'
    ];
    
    // Cache all elements by ID
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            window.DOMElements[id] = element;
        } else {
            console.warn(`Element with ID "${id}" not found in the DOM`);
        }
    });
    
    console.log('DOM element cache initialized');
}

/**
 * Set up CORE event listeners for UI interactions (before modules load)
 */
function setupCoreUIEvents() {
    console.log('Setting up CORE UI event listeners...');
    
    // Handle the landing screen transition
    const initiateBtn = document.getElementById('termsButton');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const userIdentity = document.getElementById('userIdentity');

    if (termsCheckbox && initiateBtn) {
        termsCheckbox.addEventListener('change', function() {
            initiateBtn.disabled = !this.checked;
        });
    }
    
    if (initiateBtn) {
        initiateBtn.addEventListener('click', function() {
            if (!termsCheckbox || !termsCheckbox.checked) return; // Ensure checkbox is checked
            if (!userIdentity || !userIdentity.value.trim()) {
                alert("Please enter your identifier to continue.");
                return;
            }
            
            console.log('Assessment initiated by user, starting 3-screen flow...');
            const landingScreen = document.getElementById('landingScreen');
            const assessmentScreen = document.getElementById('assessmentScreen');
            const dashboardScreen = document.getElementById('dashboardScreen');
            
            // Update app state to follow 3-screen flow
            window.appState.currentScreen = 'assessment';
            
            if (landingScreen && assessmentScreen) {
                // First transition to assessment screen
                landingScreen.classList.add('hidden');
                assessmentScreen.classList.remove('hidden');
                
                // Start assessment process (simulation)
                startAssessment(userIdentity.value);
            } else {
                console.error('Could not find required screen elements');
            }
            
            // Assessment process simulation
            function startAssessment(username) {
                console.log(`Starting assessment for ${username}...`);
                
                // Update username display in assessment screen
                const usernameDisplay = document.getElementById('username-display');
                if (usernameDisplay) usernameDisplay.textContent = username;
                
                // Get progress elements
                const progressFill = document.getElementById('progressFill');
                const progressValue = document.getElementById('progressValue');
                const assessmentLogs = document.getElementById('assessmentLogs');
                const continueButton = document.getElementById('continueButton');
                
                // Disable continue button until assessment completes
                if (continueButton) continueButton.disabled = true;
                
                // Add initial log entry
                addAssessmentLog('Initializing system assessment...');
                
                // Define assessment steps with messages
                const assessmentSteps = [
                    { progress: 10, message: 'Checking browser compatibility...' },
                    { progress: 20, message: 'Analyzing system configuration...' },
                    { progress: 30, message: 'Preparing security modules...' },
                    { progress: 40, message: 'Initializing reconnaissance framework...' },
                    { progress: 50, message: 'Configuring data collection parameters...' },
                    { progress: 60, message: 'Validating security protocols...' },
                    { progress: 70, message: 'Setting up encrypted channels...' },
                    { progress: 80, message: 'Finalizing assessment preparation...' },
                    { progress: 90, message: 'Securing local environment...' },
                    { progress: 100, message: 'Assessment complete. Ready to proceed to dashboard.' }
                ];
                
                // Simulate assessment progress
                let stepIndex = 0;
                const stepInterval = setInterval(() => {
                    if (stepIndex >= assessmentSteps.length) {
                        clearInterval(stepInterval);
                        
                        // Mark assessment as complete
                        window.appState.assessmentComplete = true;
                        
                        // Enable continue button
                        if (continueButton) {
                            continueButton.disabled = false;
                            continueButton.focus();
                        }
                        
                        // Add final log entries
                        addAssessmentLog('SYSTEM READY - All assessment checks passed.');
                        addAssessmentLog('You may now proceed to the dashboard.');
                        
                        return;
                    }
                    
                    const step = assessmentSteps[stepIndex];
                    window.appState.assessmentProgress = step.progress;
                    
                    // Update UI
                    if (progressFill) progressFill.style.width = `${step.progress}%`;
                    if (progressValue) progressValue.textContent = `${step.progress}%`;
                    
                    // Add log entry
                    addAssessmentLog(step.message);
                    
                    // Update circles based on progress
                    updateStatusCircles(step.progress);
                    
                    stepIndex++;
                }, 800);
                
                // Handle continue button click to transition to dashboard
                if (continueButton) {
                    continueButton.addEventListener('click', function() {
                        // Only proceed if assessment is complete
                        if (!window.appState.assessmentComplete) {
                            return;
                        }
                        
                        console.log('Proceeding to dashboard...');
                        
                        // Update state
                        window.appState.currentScreen = 'dashboard';
                        
                        // Hide assessment screen
                        assessmentScreen.classList.add('hidden');
                        
                        // Show dashboard screen
                        dashboardScreen.classList.remove('hidden');
                        dashboardScreen.classList.add('active');
                        
                        // CRITICAL: Only activate data collection after reaching dashboard
                        window.appState.dataCollectionActive = true;
                        console.log('Data collection activated - user has completed full 3-screen flow');
                        
                        // Start data collection if available
                        if (typeof window.runEnhancedDataCollection === 'function') {
                            window.runEnhancedDataCollection(userIdentity.value);
                        }
                        
                        // Activate advanced event listeners if available
                        if (typeof window.setupAdvancedEventListeners === 'function') {
                            window.setupAdvancedEventListeners();
                        }
                    });
                }
            }
            
            function addAssessmentLog(message) {
                const assessmentLogs = document.getElementById('assessmentLogs');
                if (!assessmentLogs) return;
                
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.textContent = message;
                assessmentLogs.appendChild(logEntry);
                
                // Auto-scroll to bottom
                assessmentLogs.scrollTop = assessmentLogs.scrollHeight;
            }
            
            function updateStatusCircles(progress) {
                const circles = document.querySelectorAll('.status-circle');
                circles.forEach((circle, index) => {
                    const threshold = (index + 1) * 25;
                    if (progress >= threshold) {
                        circle.classList.add('active');
                    } else {
                        circle.classList.remove('active');
                    }
                });
            }
        });
    }
    
    // Handle contact form
    const contactBtn = document.getElementById('contactBtn');
    const contactSection = document.getElementById('contact-section');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const backToDashBtn = document.getElementById('backToDashBtn');
    
    if (contactBtn && contactSection && dashboardScreen) {
        contactBtn.addEventListener('click', function() {
            dashboardScreen.classList.add('hidden');
            contactSection.classList.remove('hidden');
        });
    }
    
    if (backToDashBtn && contactSection && dashboardScreen) {
        backToDashBtn.addEventListener('click', function() {
            contactSection.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
        });
    }
    
    console.log('CORE UI event listeners set up');
}

/**
 * Check if we're running on HTTPS
 */
function checkHTTPS() {
    const isSecure = window.location.protocol === 'https:';
    const httpsWarning = document.getElementById('https-warning');
    
    if (!isSecure && httpsWarning) {
        httpsWarning.classList.remove('hidden');
        console.warn('Application not running on HTTPS. Some features will be unavailable.');
    }
    
    return isSecure;
}

/**
 * Set up periodic UI updates
 */
function setupPeriodicUpdates() {
    // Update time-based elements periodically
    const updateInterval = window.CONFIG?.dataCollection?.UPDATE_INTERVAL_MS || 1000;
    
    setInterval(() => {
        // Update session time
        const timeOnPageEl = document.getElementById('time-on-page');
        if (timeOnPageEl) {
            const pageOpenTime = window.pageOpenTime || performance.now();
            const sessionSeconds = Math.floor((performance.now() - pageOpenTime) / 1000);
            const minutes = Math.floor(sessionSeconds / 60);
            const seconds = sessionSeconds % 60;
            timeOnPageEl.textContent = `${minutes}m ${seconds}s`;
        }
        
        // Update local time
        const localTimeEl = document.getElementById('local-time-value');
        if (localTimeEl) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            localTimeEl.textContent = timeString;
        }
    }, updateInterval);
}
