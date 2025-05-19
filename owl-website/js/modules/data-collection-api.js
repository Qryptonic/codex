/**
 * Data Collection API Module
 * Centralized API for all data collection functions
 * Enhanced for maximum legal data extraction with user consent
 */

'use strict';

// Import from config module
import { CONFIG, logger, features } from './config.js';
import { dataCollectionHash, combineHashes } from './core.js';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.dataCollection = window.modules.dataCollection || {};

/**
 * Run the enhanced data collection process
 * This is the main entry point that coordinates all data collection
 * Gathers maximum legally permitted data with user consent
 */
export async function runEnhancedDataCollection(userName) {
    logger.info('Starting enhanced data collection process');
    
    try {
        // Initialize basics first
        initializeBasics(userName);
        
        // Run device and browser data collection
        collectSystemData();
        
        // Run network analysis
        await analyzeNetwork();
        
        // Run advanced fingerprinting methods
        await generateFingerprints();
        
        // Analyze hardware when available
        await analyzeHardware();
        
        // Initialize advanced hardware monitoring
        if (typeof window.initializeHardwareConnect === 'function') {
            await window.initializeHardwareConnect();
            logger.info('Advanced hardware monitoring initialized');
        }
        
        // Initialize behavioral analysis
        if (typeof window.initBehavioralAnalysis === 'function') {
            window.initBehavioralAnalysis();
        }
        
        // Detect fonts for fingerprinting
        if (typeof window.detectFonts === 'function') {
            window.detectFonts();
        }
        
        // Advanced security scanning
        runSecurityScanning();
        
        // Schedule progressive data collection for additional information
        scheduleProgressiveCollection();
        
        // Update risk scores
        calculateRiskScores();
        
        logger.info('Initial data collection completed successfully');
        return true;
    } catch (error) {
        logger.error('Error during enhanced data collection:', error);
        // Use enterprise error reporting system
        logEnterpriseError('Failed to complete data collection process: ' + error.message, 'high', 'DATA-COLLECTION');
        return false;
    }
}

/**
 * Initialize basic values and UI elements
 * @param {string} userName - The username provided by the user
 */
function initializeBasics(userName) {
    logger.debug('Initializing basic data');
    
    // Create global user profile object to store all collected data
    window.userProfile = window.userProfile || {
        id: null,
        userName: null,
        timestamp: new Date().toISOString(),
        sessionId: null,
        deviceInfo: {},
        browserInfo: {},
        networkInfo: {},
        fingerprintData: {},
        behavioralData: {},
        privacyMetrics: {
            fingerprintUniqueness: 0,
            identityExposure: 0,
            trackingPotential: 0
        }
    };
    
    // Set username if available
    const usernameEl = document.getElementById('username-value');
    
    if (usernameEl) {
        const displayName = userName || (document.getElementById('userIdentity')?.value) || 'ANONYMOUS';
        usernameEl.textContent = displayName;
        window.userProfile.userName = displayName;
    }
    
    // Set session ID with more entropy
    const sessionEl = document.getElementById('session-id-value');
    if (sessionEl) {
        const entropy = [
            navigator.userAgent,
            Date.now(),
            Math.random().toString(),
            window.screen.width + 'x' + window.screen.height,
            navigator.language,
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ].join('|');
        
        const sessionId = dataCollectionHash(entropy);
        sessionEl.textContent = sessionId;
        window.userProfile.sessionId = sessionId;
    }
    
    // Record page open time
    window.pageOpenTime = performance.now();
    window.userProfile.pageOpenTime = window.pageOpenTime;
    
    // Initialize basic device type
    setDeviceType();
    
    // Set summary location to TZ for now
    const summaryLocationEl = document.getElementById('summary-location');
    if (summaryLocationEl) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        const locationEstimate = timezone.replace(/\//g, ', ').replace(/_/g, ' ');
        summaryLocationEl.textContent = locationEstimate;
    }
    
    // Update date in copyright footer
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }
}

/**
 * Detect and set the device type
 */
function setDeviceType() {
    logger.debug('Detecting device type');
    
    const deviceTypeEl = document.getElementById('device-type-value');
    if (!deviceTypeEl) return;
    
    let deviceType = 'Desktop';
    
    // Simple detection logic
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        deviceType = 'Mobile';
        
        if (/iPad|tablet|Tablet/i.test(navigator.userAgent)) {
            deviceType = 'Tablet';
        }
    }
    
    deviceTypeEl.textContent = deviceType;
    deviceTypeEl.classList.remove('loading');
}

/**
 * Collect system data (device, OS, browser)
 */
function collectSystemData() {
    logger.debug('Collecting system data');
    
    // Set OS information
    const osEl = document.getElementById('os-value');
    if (osEl) {
        osEl.textContent = getOSInfo();
        osEl.classList.remove('loading');
    }
    
    // Set CPU/memory info
    const cpuEl = document.getElementById('cpu-value');
    if (cpuEl && navigator.hardwareConcurrency) {
        cpuEl.textContent = `${navigator.hardwareConcurrency} CORES`;
        cpuEl.classList.remove('loading');
    }
    
    const memoryEl = document.getElementById('memory-value');
    if (memoryEl && navigator.deviceMemory) {
        memoryEl.textContent = `${navigator.deviceMemory} GB (API)`;
        memoryEl.classList.remove('loading');
    }
    
    // Set screen information
    const screenEl = document.getElementById('screen-value');
    if (screenEl) {
        screenEl.textContent = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x)`;
        screenEl.classList.remove('loading');
    }
    
    const viewportEl = document.getElementById('viewport-value');
    if (viewportEl) {
        viewportEl.textContent = `${window.innerWidth}x${window.innerHeight}`;
        viewportEl.classList.remove('loading');
    }
    
    // Set browser information
    const browserEl = document.getElementById('browser-value');
    if (browserEl) {
        const browserInfo = getBrowserInfo();
        browserEl.textContent = `${browserInfo.name} ${browserInfo.version}`;
        browserEl.classList.remove('loading');
    }
    
    const userAgentEl = document.getElementById('useragent-value');
    if (userAgentEl) {
        userAgentEl.textContent = navigator.userAgent;
        userAgentEl.classList.remove('loading');
    }
    
    // Set cookie status
    const cookiesEl = document.getElementById('cookies-value');
    if (cookiesEl) {
        cookiesEl.textContent = navigator.cookieEnabled ? 'ENABLED' : 'DISABLED';
        cookiesEl.classList.remove('loading');
    }
    
    // Set DNT status
    const dntEl = document.getElementById('dnt-value');
    if (dntEl) {
        const dntStatus = getDNTStatus();
        dntEl.textContent = dntStatus;
        dntEl.classList.remove('loading');
    }
}

/**
 * Get the browser's Do Not Track status
 * @returns {string} DNT status message
 */
function getDNTStatus() {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    
    if (dnt === '1' || dnt === 'yes') {
        return 'ENABLED (DNT=1)';
    } else if (dnt === '0' || dnt === 'no') {
        return 'EXPLICITLY DISABLED';
    } else {
        return 'NOT ENABLED';
    }
}

/**
 * Get information about the operating system
 * @returns {string} OS name and version
 */
function getOSInfo() {
    const ua = navigator.userAgent;
    let osName = 'Unknown OS';
    let osVersion = '';
    
    // Windows detection
    if (ua.indexOf('Windows') !== -1) {
        osName = 'Windows';
        if (ua.indexOf('Windows NT 10.0') !== -1) osVersion = '10';
        else if (ua.indexOf('Windows NT 6.3') !== -1) osVersion = '8.1';
        else if (ua.indexOf('Windows NT 6.2') !== -1) osVersion = '8';
        else if (ua.indexOf('Windows NT 6.1') !== -1) osVersion = '7';
        else if (ua.indexOf('Windows NT 6.0') !== -1) osVersion = 'Vista';
        else if (ua.indexOf('Windows NT 5.1') !== -1) osVersion = 'XP';
    }
    // macOS detection
    else if (ua.indexOf('Mac OS X') !== -1) {
        osName = 'macOS';
        // Extract version if available
        const macOSMatch = ua.match(/Mac OS X ([0-9_]+)/);
        if (macOSMatch && macOSMatch[1]) {
            osVersion = macOSMatch[1].replace(/_/g, '.');
        }
    }
    // iOS detection
    else if (/(iPhone|iPad|iPod)/.test(ua)) {
        osName = 'iOS';
        // Extract version if available
        const iOSMatch = ua.match(/OS ([0-9_]+)/);
        if (iOSMatch && iOSMatch[1]) {
            osVersion = iOSMatch[1].replace(/_/g, '.');
        }
    }
    // Android detection
    else if (ua.indexOf('Android') !== -1) {
        osName = 'Android';
        // Extract version if available
        const androidMatch = ua.match(/Android ([0-9.]+)/);
        if (androidMatch && androidMatch[1]) {
            osVersion = androidMatch[1];
        }
    }
    // Linux detection
    else if (ua.indexOf('Linux') !== -1) {
        osName = 'Linux';
    }
    
    return osVersion ? `${osName} ${osVersion}` : osName;
}

/**
 * Get information about the browser
 * @returns {Object} Browser name and version
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = '';
    
    // Chrome
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1 && ua.indexOf('OPR') === -1) {
        browserName = 'Chrome';
        const chromeMatch = ua.match(/Chrome\/([0-9.]+)/);
        if (chromeMatch && chromeMatch[1]) {
            browserVersion = chromeMatch[1].split('.')[0];
        }
    }
    // Edge
    else if (ua.indexOf('Edg') !== -1) {
        browserName = 'Edge';
        const edgeMatch = ua.match(/Edg\/([0-9.]+)/);
        if (edgeMatch && edgeMatch[1]) {
            browserVersion = edgeMatch[1].split('.')[0];
        }
    }
    // Firefox
    else if (ua.indexOf('Firefox') !== -1) {
        browserName = 'Firefox';
        const ffMatch = ua.match(/Firefox\/([0-9.]+)/);
        if (ffMatch && ffMatch[1]) {
            browserVersion = ffMatch[1].split('.')[0];
        }
    }
    // Safari
    else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
        browserName = 'Safari';
        const safariMatch = ua.match(/Version\/([0-9.]+)/);
        if (safariMatch && safariMatch[1]) {
            browserVersion = safariMatch[1].split('.')[0];
        }
    }
    // Opera
    else if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) {
        browserName = 'Opera';
        const operaMatch = ua.match(/(?:OPR|Opera)\/([0-9.]+)/);
        if (operaMatch && operaMatch[1]) {
            browserVersion = operaMatch[1].split('.')[0];
        }
    }
    
    return {
        name: browserName,
        version: browserVersion
    };
}

/**
 * Analyze network information
 */
async function analyzeNetwork() {
    logger.debug('Analyzing network information');
    
    // Set timezone info
    const timezoneEl = document.getElementById('timezone-value');
    if (timezoneEl) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        timezoneEl.textContent = timezone || 'UNKNOWN';
        timezoneEl.classList.remove('loading');
    }
    
    // Set language info
    const languageEl = document.getElementById('language-value');
    if (languageEl) {
        languageEl.textContent = navigator.language || 'UNKNOWN';
        languageEl.classList.remove('loading');
    }
    
    const languagesEl = document.getElementById('languages-value');
    if (languagesEl && navigator.languages) {
        languagesEl.textContent = navigator.languages.join(', ');
        languagesEl.classList.remove('loading');
    }
    
    // Set connection info
    const connectionEl = document.getElementById('connection-value');
    if (connectionEl) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            connectionEl.textContent = connection.effectiveType || connection.type || 'UNKNOWN';
        } else {
            connectionEl.textContent = 'API N/A';
        }
        connectionEl.classList.remove('loading');
    }
    
    // Set bandwidth info
    const bandwidthEl = document.getElementById('bandwidth-value');
    if (bandwidthEl) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.downlink) {
            bandwidthEl.textContent = `${connection.downlink} Mbps`;
        } else {
            bandwidthEl.textContent = 'API N/A';
        }
        bandwidthEl.classList.remove('loading');
    }
    
    // Set latency info
    const latencyEl = document.getElementById('latency-value');
    if (latencyEl) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.rtt) {
            latencyEl.textContent = `${connection.rtt} ms`;
        } else {
            latencyEl.textContent = 'API N/A';
        }
        latencyEl.classList.remove('loading');
    }
}

/**
 * Generate comprehensive browser fingerprints
 * Collects and calculates multiple fingerprinting techniques
 */
async function generateFingerprints() {
    logger.debug('Generating browser fingerprints');
    
    try {
        // Call the specialized fingerprinting module function if available
        if (typeof window.collectFingerprints === 'function') {
            logger.debug('Using external fingerprinting module');
            await window.collectFingerprints();
            return;
        }
        
        // Fallback implementation if module not available
        logger.debug('Using fallback fingerprinting implementation');
        
        // Canvas fingerprinting
        const canvasFingerprint = await generateFallbackCanvasFingerprint();
        const canvasEl = document.getElementById('canvas-value');
        if (canvasEl) {
            canvasEl.textContent = canvasFingerprint;
            canvasEl.classList.add('severity-high');
        }
        
        // WebGL fingerprinting
        const webglFingerprint = await generateFallbackWebGLFingerprint();
        const webglEl = document.getElementById('webgl-value');
        if (webglEl) {
            webglEl.textContent = webglFingerprint;
            webglEl.classList.add('severity-high');
        }
        
        // Combined fingerprint
        const fingerprintEl = document.getElementById('fingerprint-value');
        if (fingerprintEl) {
            // Advanced fingerprint using multiple signals
            const combinedFingerprint = dataCollectionHash(
                navigator.userAgent + 
                window.screen.width + 
                window.screen.height +
                navigator.language +
                Intl.DateTimeFormat().resolvedOptions().timeZone +
                canvasFingerprint +
                webglFingerprint +
                navigator.hardwareConcurrency +
                (navigator.deviceMemory || '') +
                (navigator.platform || '') +
                Object.keys(navigator.plugins || {}).length
            );
            fingerprintEl.textContent = combinedFingerprint;
            fingerprintEl.classList.remove('loading');
            fingerprintEl.classList.add('data-corruption');
            fingerprintEl.setAttribute('data-text', 'UNIQUE PROFILE DETECTED');
            
            // Store in the user profile
            if (window.userProfile) {
                window.userProfile.fingerprintData = {
                    canvas: canvasFingerprint,
                    webgl: webglFingerprint,
                    combined: combinedFingerprint
                };
            }
        }
    } catch (error) {
        logger.error('Error generating fingerprints:', error);
    }
}

/**
 * Generates a basic canvas fingerprint if the main module is unavailable
 */
async function generateFallbackCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'CANVAS_API_BLOCKED';
        
        // Text with font variations
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(10, 10, 100, 30);
        ctx.fillStyle = '#069';
        ctx.font = '15px Arial';
        ctx.fillText('Canvas Fingerprint', 15, 25);
        
        // Get the data URL and hash it
        const dataURL = canvas.toDataURL();
        return dataCollectionHash(dataURL);
    } catch (e) {
        logger.warn('Error generating canvas fingerprint:', e);
        return 'CANVAS_ERROR';
    }
}

/**
 * Generates a basic WebGL fingerprint if the main module is unavailable
 */
async function generateFallbackWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        
        // Try to get WebGL context
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            return 'WEBGL_NOT_SUPPORTED';
        }
        
        // Collect WebGL information
        const info = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION)
        };
        
        return dataCollectionHash(JSON.stringify(info));
    } catch (e) {
        logger.warn('Error generating WebGL fingerprint:', e);
        return 'WEBGL_ERROR';
    }
}

/**
 * Analyze hardware capabilities and run advanced system analysis
 */
async function analyzeHardware() {
    logger.debug('Analyzing hardware capabilities');
    
    try {
        // Battery info - we'll use our module function if it exists
        if (typeof window.getBatteryInfo === 'function') {
            await window.getBatteryInfo();
        } else {
            // Fallback battery implementation
            await detectBattery();
        }
        
        // GPU info - we'll use our module function if it exists
        if (typeof window.detectGPUInfo === 'function') {
            await window.detectGPUInfo();
        } else {
            // Fallback GPU detection
            detectGPU();
        }
        
        // CPU core count
        detectCPUCores();
        
        // Memory detection
        detectMemory();
        
        // Screen information
        detectScreen();
        
        // Hardware performance benchmarking
        performHardwareBenchmark();
        
    } catch (error) {
        logger.error('Hardware analysis error:', error);
    }
}

/**
 * Detect battery information
 */
async function detectBattery() {
    const batteryTextEl = document.getElementById('battery-text');
    const batteryFillEl = document.getElementById('battery-fill');
    const batteryRateEl = document.getElementById('battery-rate');
    
    if (!navigator.getBattery) {
        if (batteryTextEl) batteryTextEl.textContent = 'API N/A';
        return;
    }
    
    try {
        const battery = await navigator.getBattery();
        
        // Update battery text
        if (batteryTextEl) {
            const level = Math.floor(battery.level * 100);
            const charging = battery.charging ? 'CHARGING' : 'DISCHARGING';
            batteryTextEl.textContent = `${level}% (${charging})`;
        }
        
        // Update battery fill
        if (batteryFillEl) {
            batteryFillEl.style.width = `${battery.level * 100}%`;
            
            // Change color based on level
            if (battery.level < 0.2) {
                batteryFillEl.style.backgroundColor = 'var(--severity-high)';
            } else if (battery.level < 0.5) {
                batteryFillEl.style.backgroundColor = 'var(--severity-medium)';
            } else {
                batteryFillEl.style.backgroundColor = 'var(--severity-low)';
            }
        }
        
        // Update charge/discharge rate
        if (batteryRateEl) {
            if (battery.charging && battery.chargingTime !== Infinity) {
                const minutes = Math.floor(battery.chargingTime / 60);
                batteryRateEl.textContent = `FULL IN ~${minutes} MIN`;
            } else if (!battery.charging && battery.dischargingTime !== Infinity) {
                const minutes = Math.floor(battery.dischargingTime / 60);
                batteryRateEl.textContent = `EMPTY IN ~${minutes} MIN`;
            } else {
                batteryRateEl.textContent = 'CALCULATING...';
            }
        }
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.deviceInfo.battery = {
                level: battery.level,
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        }
        
        // Set up battery change event listener
        battery.addEventListener('levelchange', () => {
            if (batteryTextEl) {
                const level = Math.floor(battery.level * 100);
                const charging = battery.charging ? 'CHARGING' : 'DISCHARGING';
                batteryTextEl.textContent = `${level}% (${charging})`;
            }
            
            if (batteryFillEl) {
                batteryFillEl.style.width = `${battery.level * 100}%`;
            }
        });
        
    } catch (error) {
        logger.error('Battery detection error:', error);
        if (batteryTextEl) batteryTextEl.textContent = 'ERROR';
    }
}

/**
 * Detect GPU information
 */
function detectGPU() {
    const gpuEl = document.getElementById('gpu-value');
    if (!gpuEl) return;
    
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            gpuEl.textContent = 'WEBGL NOT SUPPORTED';
            return;
        }
        
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        
        gpuEl.textContent = renderer || vendor || 'UNKNOWN';
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.deviceInfo.gpu = {
                renderer,
                vendor,
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            };
        }
    } catch (error) {
        logger.error('GPU detection error:', error);
        gpuEl.textContent = 'ERROR';
    }
}

/**
 * Detect CPU cores
 */
function detectCPUCores() {
    const cpuEl = document.getElementById('cpu-value');
    if (!cpuEl) return;
    
    try {
        const cores = navigator.hardwareConcurrency || 'UNKNOWN';
        cpuEl.textContent = typeof cores === 'number' ? `${cores} CORES` : cores;
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.deviceInfo.cpu = {
                cores
            };
        }
    } catch (error) {
        logger.error('CPU detection error:', error);
        cpuEl.textContent = 'ERROR';
    }
}

/**
 * Detect memory information
 */
function detectMemory() {
    const memoryEl = document.getElementById('memory-value');
    if (!memoryEl) return;
    
    try {
        if ('deviceMemory' in navigator) {
            memoryEl.textContent = `${navigator.deviceMemory} GB`;
            
            // Store in user profile
            if (window.userProfile) {
                window.userProfile.deviceInfo.memory = navigator.deviceMemory;
            }
        } else {
            memoryEl.textContent = 'API N/A';
        }
    } catch (error) {
        logger.error('Memory detection error:', error);
        memoryEl.textContent = 'ERROR';
    }
}

/**
 * Detect screen information
 */
function detectScreen() {
    const screenEl = document.getElementById('screen-value');
    const viewportEl = document.getElementById('viewport-value');
    const screenCapsEl = document.getElementById('screen-caps-value');
    
    try {
        // Screen resolution and pixel ratio
        if (screenEl) {
            screenEl.textContent = `${screen.width}x${screen.height} (${window.devicePixelRatio}x)`;
        }
        
        // Viewport size
        if (viewportEl) {
            viewportEl.textContent = `${window.innerWidth}x${window.innerHeight}`;
        }
        
        // Screen capabilities (color depth, etc)
        if (screenCapsEl) {
            screenCapsEl.textContent = `${screen.colorDepth}-bit, ${screen.pixelDepth} DEPTH`;
        }
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.deviceInfo.screen = {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                devicePixelRatio: window.devicePixelRatio,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
        }
    } catch (error) {
        logger.error('Screen detection error:', error);
    }
}

/**
 * Perform hardware benchmark
 */
function performHardwareBenchmark() {
    const jsPerformanceEl = document.getElementById('js-performance');
    if (!jsPerformanceEl) return;
    
    try {
        // Simple benchmark
        const startTime = performance.now();
        let result = 0;
        const iterations = 1000000;
        
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.cos(i);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const score = Math.round(iterations / duration * 100);
        
        jsPerformanceEl.textContent = `SCORE: ${score}`;
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.deviceInfo.performance = {
                jsScore: score,
                benchmarkDuration: duration
            };
        }
    } catch (error) {
        logger.error('Performance benchmark error:', error);
        jsPerformanceEl.textContent = 'ERROR';
    }
}

/**
 * Schedule progressive data collection to happen over time
 */
function scheduleProgressiveCollection() {
    logger.debug('Scheduling progressive data collection');
    
    // Schedule JS benchmark
    setTimeout(() => {
        if (window.benchmarkJSPerformance) {
            window.benchmarkJSPerformance();
        }
    }, 2000);
    
    // Schedule timing analysis
    setTimeout(() => {
        if (window.performTimingAnalysis) {
            window.performTimingAnalysis();
        }
    }, 3000);
    
    // Schedule GPU performance analysis
    setTimeout(() => {
        if (window.analyzeGPUPerformance) {
            window.analyzeGPUPerformance();
        }
    }, 4000);
}

// Attempt to get location information
export async function attemptLocation() {
    logger.debug('Attempting to get location');
    
    const locationEl = document.getElementById('location-value');
    const locationNote = document.getElementById('location-status-note');
    
    if (!locationEl || !locationNote) return;
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
        locationEl.textContent = 'GEOLOCATION API N/A';
        locationNote.textContent = 'Browser does not support Geolocation API';
        locationNote.classList.add('error-note');
        return;
    }
    
    // Update UI to show we're requesting
    locationEl.textContent = 'REQUESTING...';
    locationNote.textContent = 'Waiting for permission...';
    locationNote.classList.remove('error-note');
    
    try {
        // Request position with timeout
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
            
            // Set a timeout in case the permission dialog is ignored
            setTimeout(() => {
                reject(new Error('Request timed out'));
            }, 15000);
        });
        
        // Got position successfully
        const { latitude, longitude, accuracy } = position.coords;
        
        // Format for display (truncate to reasonable precision)
        const formattedLat = latitude.toFixed(4);
        const formattedLng = longitude.toFixed(4);
        const formattedAccuracy = Math.round(accuracy);
        
        // Update UI
        locationEl.textContent = `${formattedLat}, ${formattedLng} (±${formattedAccuracy}m)`;
        locationNote.textContent = 'Location access granted';
        
        // Update summary location too
        const summaryLocation = document.getElementById('summary-location');
        if (summaryLocation) {
            summaryLocation.textContent = `${formattedLat}, ${formattedLng}`;
        }
        
        logger.info('Location acquired successfully', { lat: formattedLat, lng: formattedLng });
        
    } catch (error) {
        // Handle errors
        if (error.code === 1) {
            // Permission denied
            locationEl.textContent = 'PERMISSION DENIED';
            locationNote.textContent = 'Location access was denied by user';
        } else if (error.code === 2) {
            // Position unavailable
            locationEl.textContent = 'POSITION UNAVAILABLE';
            locationNote.textContent = 'Could not determine location';
        } else if (error.code === 3) {
            // Timeout
            locationEl.textContent = 'REQUEST TIMEOUT';
            locationNote.textContent = 'Location request timed out';
        } else {
            // Other errors
            locationEl.textContent = 'ERROR';
            locationNote.textContent = error.message || 'Unknown error occurred';
        }
        
        locationNote.classList.add('error-note');
        logger.warn('Error getting location', error);
    }
}

// File system access functions
export async function analyzeFileMetadata() {
    logger.debug('Analyzing file metadata');
    
    const fileMetaEl = document.getElementById('file-meta-value');
    const fileMetaNote = document.getElementById('file-meta-status-note');
    
    if (!fileMetaEl || !fileMetaNote) return;
    
    // Check if file system API is available
    if (!window.showOpenFilePicker) {
        fileMetaEl.textContent = 'FILE API N/A';
        fileMetaNote.textContent = 'Browser does not support File System Access API';
        fileMetaNote.classList.add('error-note');
        return;
    }
    
    // Update UI to show we're requesting
    fileMetaEl.textContent = 'REQUESTING...';
    fileMetaNote.textContent = 'Waiting for file selection...';
    fileMetaNote.classList.remove('error-note');
    
    try {
        // Open file picker
        const [fileHandle] = await window.showOpenFilePicker({
            multiple: false
        });
        
        // Get file object
        const file = await fileHandle.getFile();
        
        // Extract metadata
        const metadata = {
            name: file.name,
            type: file.type || 'unknown',
            size: file.size,
            lastModified: new Date(file.lastModified).toLocaleString()
        };
        
        // Update UI
        fileMetaEl.textContent = `${metadata.name} (${formatFileSize(metadata.size)})`;
        fileMetaNote.textContent = `Type: ${metadata.type}, Last Modified: ${metadata.lastModified}`;
        
        logger.info('File metadata analyzed', metadata);
        
    } catch (error) {
        // Handle errors (including user cancellation)
        if (error.name === 'AbortError') {
            fileMetaEl.textContent = 'USER CANCELLED';
            fileMetaNote.textContent = 'File selection was cancelled';
        } else {
            fileMetaEl.textContent = 'ERROR';
            fileMetaNote.textContent = error.message || 'Unknown error occurred';
            fileMetaNote.classList.add('error-note');
        }
        
        logger.warn('Error analyzing file metadata', error);
    }
}

export async function saveSummaryToFile() {
    logger.debug('Saving summary to file');
    
    const saveFileEl = document.getElementById('save-file-value');
    const saveFileNote = document.getElementById('save-file-status-note');
    
    if (!saveFileEl || !saveFileNote) return;
    
    // Check if file system API is available
    if (!window.showSaveFilePicker) {
        saveFileEl.textContent = 'FILE API N/A';
        saveFileNote.textContent = 'Browser does not support File System Access API';
        saveFileNote.classList.add('error-note');
        return;
    }
    
    // Update UI to show we're requesting
    saveFileEl.textContent = 'REQUESTING...';
    saveFileNote.textContent = 'Waiting for save location...';
    saveFileNote.classList.remove('error-note');
    
    try {
        // Create file content - simple JSON of collected data
        const summary = {
            timestamp: new Date().toISOString(),
            device: {
                type: document.getElementById('device-type-value')?.textContent || 'Unknown',
                os: document.getElementById('os-value')?.textContent || 'Unknown',
                browser: document.getElementById('browser-value')?.textContent || 'Unknown'
            },
            network: {
                connection: document.getElementById('connection-value')?.textContent || 'Unknown',
                ip: document.getElementById('ip-value')?.textContent || 'Unknown'
            },
            fingerprints: {
                browser: document.getElementById('fingerprint-value')?.textContent || 'Unknown',
                canvas: document.getElementById('canvas-value')?.textContent || 'Unknown'
            },
            risk: {
                privacy: document.getElementById('privacy-score')?.textContent || 'Unknown',
                tracking: document.getElementById('tracking-score')?.textContent || 'Unknown',
                exposure: document.getElementById('exposed-data')?.textContent || 'Unknown'
            }
        };
        
        // Create JSON string with pretty formatting
        const jsonContent = JSON.stringify(summary, null, 2);
        
        // Open file save dialog
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'owl-security-scan.json',
            types: [{
                description: 'JSON File',
                accept: { 'application/json': ['.json'] }
            }]
        });
        
        // Create writable stream
        const writable = await fileHandle.createWritable();
        
        // Write content
        await writable.write(jsonContent);
        
        // Close file
        await writable.close();
        
        // Update UI
        saveFileEl.textContent = 'SAVED';
        saveFileNote.textContent = `File saved as ${fileHandle.name}`;
        
        logger.info('Summary saved to file', { filename: fileHandle.name });
        
    } catch (error) {
        // Handle errors (including user cancellation)
        if (error.name === 'AbortError') {
            saveFileEl.textContent = 'USER CANCELLED';
            saveFileNote.textContent = 'File save was cancelled';
        } else {
            saveFileEl.textContent = 'ERROR';
            saveFileNote.textContent = error.message || 'Unknown error occurred';
            saveFileNote.classList.add('error-note');
        }
        
        logger.warn('Error saving summary to file', error);
    }
}

// Push notification functions
export async function enablePushNotifications() {
    logger.debug('Enabling push notifications');
    
    const pushEl = document.getElementById('push-alert-value');
    const pushNote = document.getElementById('push-alert-status-note');
    
    if (!pushEl || !pushNote) return;
    
    // Check if service worker API is available
    if (!('serviceWorker' in navigator)) {
        pushEl.textContent = 'SW API N/A';
        pushNote.textContent = 'Service Worker API not supported';
        pushNote.classList.add('error-note');
        return;
    }
    
    // Check if Push API is available
    if (!('PushManager' in window)) {
        pushEl.textContent = 'PUSH API N/A';
        pushNote.textContent = 'Push API not supported';
        pushNote.classList.add('error-note');
        return;
    }
    
    // Update UI to show we're requesting
    pushEl.textContent = 'REQUESTING...';
    pushNote.textContent = 'Waiting for permission...';
    pushNote.classList.remove('error-note');
    
    try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            pushEl.textContent = 'PERMISSION DENIED';
            pushNote.textContent = 'Notification permission was denied';
            pushNote.classList.add('error-note');
            return;
        }
        
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe to push notifications
        // Note: In a real app, you would need a VAPID key from your server
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                // This is a placeholder VAPID public key - would come from server in real app
                'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            )
        });
        
        // Update UI
        pushEl.textContent = 'ENABLED';
        pushNote.textContent = 'Push notifications enabled';
        
        // Simulate a push notification after a delay
        setTimeout(() => {
            simulatePushNotification();
        }, 3000);
        
        logger.info('Push notifications enabled', { subscription });
        
    } catch (error) {
        // Handle errors
        pushEl.textContent = 'ERROR';
        pushNote.textContent = error.message || 'Unknown error occurred';
        pushNote.classList.add('error-note');
        
        logger.warn('Error enabling push notifications', error);
    }
}

// Helper function to convert base64 to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// Function to simulate receiving a push notification
export function simulatePushNotification() {
    logger.debug('Simulating push notification');
    
    if (!('Notification' in window)) {
        logger.warn('Notifications not supported');
        return;
    }
    
    if (Notification.permission === 'granted') {
        const notification = new Notification('Owl Security Alert', {
            body: 'This is a simulated security alert notification.',
            icon: '/img/owl-icon-192.png'
        });
        
        notification.onclick = () => {
            console.log('Notification clicked');
            window.focus();
        };
        
        logger.info('Push notification simulated');
    }
}

// Background sync functions
export async function queueBackgroundSync() {
    logger.debug('Queuing background sync');
    
    const syncEl = document.getElementById('bg-sync-value');
    const syncNote = document.getElementById('bg-sync-status-note');
    
    if (!syncEl || !syncNote) return;
    
    // Check if service worker API is available
    if (!('serviceWorker' in navigator)) {
        syncEl.textContent = 'SW API N/A';
        syncNote.textContent = 'Service Worker API not supported';
        syncNote.classList.add('error-note');
        return;
    }
    
    // Check if Background Sync API is available
    if (!('SyncManager' in window)) {
        syncEl.textContent = 'SYNC API N/A';
        syncNote.textContent = 'Background Sync API not supported';
        syncNote.classList.add('error-note');
        return;
    }
    
    // Update UI to show we're requesting
    syncEl.textContent = 'REGISTERING...';
    syncNote.textContent = 'Setting up sync...';
    syncNote.classList.remove('error-note');
    
    try {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Register sync
        await registration.sync.register('owl-data-sync');
        
        // Update UI
        syncEl.textContent = 'QUEUED';
        syncNote.textContent = 'Background sync queued successfully';
        
        logger.info('Background sync queued');
        
    } catch (error) {
        // Handle errors
        syncEl.textContent = 'ERROR';
        syncNote.textContent = error.message || 'Unknown error occurred';
        syncNote.classList.add('error-note');
        
        logger.warn('Error queuing background sync', error);
    }
}

/**
 * Calculate and update risk scores
 */
function calculateRiskScores() {
    logger.debug('Calculating risk scores');
    
    // Elements to update
    const privacyScoreEl = document.getElementById('privacy-score');
    const trackingScoreEl = document.getElementById('tracking-score');
    const identityScoreEl = document.getElementById('identity-score');
    const leakageScoreEl = document.getElementById('leakage-score');
    const exposedDataEl = document.getElementById('exposed-data');
    const overallRiskEl = document.getElementById('overall-risk-value');
    
    try {
        // Calculate scores - base values
        let privacyScore = 70; // Start with default privacy score (lower is worse)
        let trackingScore = 40; // Start with default tracking potential (higher is worse)
        let identityScore = 30; // Start with default identity exposure (higher is worse)
        
        // Adjust privacy score based on collected data
        if (window.userProfile) {
            // DNT lowers tracking score
            if (navigator.doNotTrack === "1") {
                trackingScore -= 15;
                privacyScore += 10;
            }
            
            // Canvas fingerprinting impact
            if (window.userProfile.fingerprintData?.canvas) {
                trackingScore += 20;
                privacyScore -= 15;
                identityScore += 15;
            }
            
            // WebGL fingerprinting impact
            if (window.userProfile.fingerprintData?.webgl) {
                trackingScore += 15;
                privacyScore -= 10;
                identityScore += 10;
            }
            
            // Hardware info impact
            if (window.userProfile.deviceInfo?.gpu) {
                trackingScore += 5;
                identityScore += 5;
            }
            
            // Battery API impact
            if (window.userProfile.deviceInfo?.battery) {
                trackingScore += 10;
                privacyScore -= 5;
            }
            
            // Advanced hardware monitoring impact
            if (window.userProfile.hardwareProfile) {
                // Check how many hardware permissions granted
                if (window.userProfile.hardwareProfile.permissionCount) {
                    const permCount = window.userProfile.hardwareProfile.permissionCount;
                    trackingScore += permCount * 5;
                    identityScore += permCount * 3;
                    privacyScore -= permCount * 2;
                }
                
                // Motion/orientation data impact
                if (window.userProfile.hardwareProfile.motion || window.userProfile.hardwareProfile.orientation) {
                    trackingScore += 15;
                    identityScore += 10;
                }
                
                // Geolocation impact (highest privacy risk)
                if (window.userProfile.hardwareProfile.geolocation) {
                    trackingScore += 25;
                    identityScore += 30;
                    privacyScore -= 25;
                }
                
                // Media devices impact
                if (window.userProfile.hardwareProfile.mediaDevices) {
                    trackingScore += 15;
                    identityScore += 10;
                }
            }
        }
        
        // Ensure scores are within range
        privacyScore = Math.max(0, Math.min(100, privacyScore));
        trackingScore = Math.max(0, Math.min(100, trackingScore));
        identityScore = Math.max(0, Math.min(100, identityScore));
        
        // Calculate leakage score (inverse of privacy)
        const leakageScore = 100 - privacyScore;
        
        // Update UI
        if (privacyScoreEl) {
            privacyScoreEl.textContent = privacyScore;
            // Higher privacy is better
            setSeverityByValue(privacyScoreEl, privacyScore, 70, 40, true);
        }
        
        if (trackingScoreEl) {
            trackingScoreEl.textContent = trackingScore;
            // Higher tracking is worse
            setSeverityByValue(trackingScoreEl, trackingScore, 30, 60);
        }
        
        if (identityScoreEl) {
            identityScoreEl.textContent = identityScore;
            // Higher identity exposure is worse
            setSeverityByValue(identityScoreEl, identityScore, 30, 60);
        }
        
        if (leakageScoreEl) {
            leakageScoreEl.textContent = leakageScore;
            // Higher leakage is worse
            setSeverityByValue(leakageScoreEl, leakageScore, 30, 60);
        }
        
        // Overall risk level
        const overallRisk = Math.round((trackingScore + identityScore + leakageScore) / 3);
        
        // Textual risk descriptions
        let riskText = 'MODERATE';
        if (overallRisk > 70) {
            riskText = 'CRITICAL';
        } else if (overallRisk > 50) {
            riskText = 'HIGH';
        } else if (overallRisk < 30) {
            riskText = 'LOW';
        }
        
        if (exposedDataEl) {
            exposedDataEl.textContent = riskText;
            // Higher exposure is worse
            setSeverityByValue(exposedDataEl, overallRisk, 30, 60);
        }
        
        if (overallRiskEl) {
            overallRiskEl.textContent = riskText;
            // Higher overall risk is worse
            setSeverityByValue(overallRiskEl, overallRisk, 30, 60);
        }
        
        // Store in user profile
        if (window.userProfile) {
            window.userProfile.privacyMetrics = {
                privacyScore,
                trackingScore,
                identityScore,
                leakageScore,
                overallRisk,
                riskLevel: riskText
            };
        }
        
    } catch (error) {
        logger.error('Error calculating risk scores:', error);
    }
}

/**
 * Set severity class based on numeric value and thresholds
 * @param {Element} element - The element to set severity on
 * @param {number} value - The numeric value
 * @param {number} lowThreshold - Threshold for low severity
 * @param {number} highThreshold - Threshold for high severity
 * @param {boolean} invertScale - True if higher values are better
 */
function setSeverityByValue(element, value, lowThreshold, highThreshold, invertScale = false) {
    if (!element) return;
    
    element.classList.remove('severity-low', 'severity-medium', 'severity-high');
    
    if (invertScale) {
        // Higher values are better (e.g., privacy score)
        if (value >= highThreshold) {
            element.classList.add('severity-low');
        } else if (value >= lowThreshold) {
            element.classList.add('severity-medium');
        } else {
            element.classList.add('severity-high');
        }
    } else {
        // Higher values are worse (e.g., tracking score)
        if (value <= lowThreshold) {
            element.classList.add('severity-low');
        } else if (value <= highThreshold) {
            element.classList.add('severity-medium');
        } else {
            element.classList.add('severity-high');
        }
    }
}

/**
 * Run advanced security scanning
 */
function runSecurityScanning() {
    logger.debug('Running security scanning');
    
    // Simulate finding trackers
    simulateTrackerDetection();
    
    // Set device summary
    setDeviceSummary();
    
    // Update persistence likelihood
    updatePersistenceLikelihood();
    
    // Update browser uniqueness
    updateBrowserUniqueness();
}

/**
 * Simulate finding trackers on the page
 */
function simulateTrackerDetection() {
    const trackersValueEl = document.getElementById('trackers-value');
    if (!trackersValueEl) return;
    
    // Simulate tracker detection with cyberpunk theming
    const trackerTypes = [
        'BEHAVIORAL', 'SESSION', 'FINGERPRINT', 
        'CANVAS', 'WEBGL', 'FONT', 'BATTERY', 
        'HARDWARE', 'NAVIGATOR'
    ];
    
    // Randomly select 3-5 tracker types
    const trackerCount = 3 + Math.floor(Math.random() * 3);
    const detectedTrackers = [];
    
    for (let i = 0; i < trackerCount; i++) {
        const index = Math.floor(Math.random() * trackerTypes.length);
        detectedTrackers.push(trackerTypes[index]);
        trackerTypes.splice(index, 1);
    }
    
    // Update UI
    trackersValueEl.textContent = `${trackerCount} DETECTED`;
    trackersValueEl.classList.add('severity-high');
    
    // Store in user profile
    if (window.userProfile) {
        window.userProfile.trackers = {
            count: trackerCount,
            types: detectedTrackers
        };
    }
}

/**
 * Set device summary for executive summary panel
 */
function setDeviceSummary() {
    const summaryDeviceEl = document.getElementById('summary-device');
    if (!summaryDeviceEl) return;
    
    const browserName = document.getElementById('browser-value')?.textContent || 'Unknown Browser';
    const osValue = document.getElementById('os-value')?.textContent || 'Unknown OS';
    const deviceType = document.getElementById('device-type-value')?.textContent || 'Unknown Device';
    
    summaryDeviceEl.textContent = `${deviceType}, ${osValue}, ${browserName}`;
}

/**
 * Update persistence likelihood in summary
 */
function updatePersistenceLikelihood() {
    const persistenceEl = document.getElementById('summary-persistence');
    if (!persistenceEl) return;
    
    let persistenceScore = 50; // Base persistence score
    
    // Check for persistence mechanisms
    if ('localStorage' in window && 'indexedDB' in window) {
        persistenceScore += 25;
    }
    
    if ('serviceWorker' in navigator) {
        persistenceScore += 10;
    }
    
    // Determine text
    let persistenceText = 'MODERATE';
    if (persistenceScore > 80) {
        persistenceText = 'VERY HIGH';
    } else if (persistenceScore > 60) {
        persistenceText = 'HIGH';
    } else if (persistenceScore < 40) {
        persistenceText = 'LOW';
    }
    
    persistenceEl.textContent = persistenceText;
    
    // Set severity class
    if (persistenceScore > 80) {
        persistenceEl.classList.add('severity-high');
    } else if (persistenceScore > 50) {
        persistenceEl.classList.add('severity-medium');
    } else {
        persistenceEl.classList.add('severity-low');
    }
}

/**
 * Update browser uniqueness in summary
 */
function updateBrowserUniqueness() {
    const uniquenessEl = document.getElementById('summary-uniqueness');
    if (!uniquenessEl) return;
    
    // Browser uniqueness is generally very high from fingerprinting perspective
    const uniquenessScore = 85 + Math.floor(Math.random() * 10);
    let uniquenessText = ''; 
    
    if (uniquenessScore >= 95) {
        uniquenessText = 'EXTREME (1 IN 200K+)';
    } else if (uniquenessScore >= 90) {
        uniquenessText = 'VERY HIGH (1 IN 50K+)';
    } else if (uniquenessScore >= 80) {
        uniquenessText = 'HIGH (1 IN 10K+)';
    } else {
        uniquenessText = 'MODERATE (1 IN 1K+)';
    }
    
    uniquenessEl.textContent = uniquenessText;
    uniquenessEl.classList.add('severity-high');
}

/**
 * Test the enterprise error tracking system
 * This function intentionally triggers errors to demonstrate the tracking system
 */
export function testEnterpriseErrorTracking() {
    logger.debug('Testing enterprise error tracking system');
    
    // Schedule a series of test errors with different severities
    setTimeout(() => {
        logEnterpriseError('Low severity test error - No real impact', 'low', 'TEST-MODULE');
    }, 1000);
    
    setTimeout(() => {
        logEnterpriseError('Medium severity test error - Partial functionality affected', 'medium', 'TEST-MODULE');
    }, 3000);
    
    setTimeout(() => {
        logEnterpriseError('High severity test error - Critical component affected', 'high', 'TEST-MODULE');
    }, 5000);
    
    // Trigger a simulated JavaScript error
    setTimeout(() => {
        try {
            // Intentionally cause an error
            const nonExistentObject = undefined;
            nonExistentObject.someProperty = 'test'; // This will throw TypeError
        } catch (error) {
            logEnterpriseError('Caught runtime error: ' + error.message, 'high', 'ERROR-TEST');
        }
    }, 7000);
    
    return true;
}

// Add to global namespace
window.modules.dataCollection = {
    // Main data collection functions
    runEnhancedDataCollection,
    attemptLocation,
    analyzeFileMetadata,
    saveSummaryToFile,
    
    // Notification and background functions
    enablePushNotifications,
    simulatePushNotification,
    queueBackgroundSync,
    
    // Hardware analysis
    detectBattery,
    detectGPU,
    detectCPUCores,
    detectMemory,
    
    // Security and risk assessment
    calculateRiskScores,
    runSecurityScanning,
    
    // Enterprise error tracking
    logEnterpriseError,
    testEnterpriseErrorTracking
};

// Also expose directly on window for backward compatibility
window.runEnhancedDataCollection = runEnhancedDataCollection;
window.attemptLocation = attemptLocation;
window.analyzeFileMetadata = analyzeFileMetadata;
window.saveSummaryToFile = saveSummaryToFile;
window.enablePushNotifications = enablePushNotifications;
window.simulatePushNotification = simulatePushNotification;
window.queueBackgroundSync = queueBackgroundSync;
window.calculateRiskScores = calculateRiskScores;
window.testEnterpriseErrorTracking = testEnterpriseErrorTracking;

/**
 * Checks if the terms checkbox is checked
 * @returns {boolean} True if the user has acknowledged the terms
 */
function isTermsAcknowledged() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    return termsCheckbox && termsCheckbox.checked;
}

/**
 * Log enterprise error to the tracking system
 * @param {string} message - Error message
 * @param {string} severity - Error severity (high, medium, low)
 * @param {string} context - Error context or source
 * @returns {boolean} - Always returns false to allow for use in error handling
 */
export function logEnterpriseError(message, severity = 'high', context = 'DATA-COLLECTION') {
    logger.error(`[${severity.toUpperCase()}] ${message}`);
    
    // Log to global error tracker if available
    if (typeof window.errorTracker !== 'undefined' && window.errorTracker.trackError) {
        window.errorTracker.trackError(message, context, Date.now());
    }
    
    // For enterprise demos, simulate telemetry (no data actually sent)
    setTimeout(() => {
        console.log(`[Simulated] Error telemetry sent to secure monitoring system: ${message}`);
    }, 500);
    
    // Add visual indication in UI if element exists
    const errorIndicator = document.getElementById('error-indicator');
    if (errorIndicator) {
        errorIndicator.classList.add('active');
        errorIndicator.setAttribute('data-severity', severity);
        
        // Auto-hide after some time
        setTimeout(() => {
            errorIndicator.classList.remove('active');
        }, 5000);
    }
    
    return false;
}

// Make logEnterpriseError available globally
window.logEnterpriseError = logEnterpriseError;

// Initialize the module - adding more functionality
logger.info('Data Collection API module initialized - Enhanced Japanese Cyberpunk Edition');

// Missing function for security scanning
if (typeof window.runSecurityScanning === 'undefined') {
    window.runSecurityScanning = runSecurityScanning;
}