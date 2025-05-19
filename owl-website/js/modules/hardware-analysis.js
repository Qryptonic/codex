/**
 * Hardware Analysis Module
 * Provides functions for analyzing device hardware capabilities and performance
 */

'use strict';

// Import necessary functions and variables
import { CONFIG, logger } from './config.js';

// Import from core module
import { dataCollectionHash, formatFileSize } from './core.js';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.hardwareAnalysis = {};

// Use the imported dataCollectionHash function directly, no fallback needed with ES modules
const _dataCollectionHash = dataCollectionHash;

// Flag to track if core app setup is complete
let appReady = false;

// Define all functions first
async function getBatteryInfo() {
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    logger.debug('Getting battery information...');
    const batteryTextEl = DOMElements['battery-text'];
    const batteryFillEl = DOMElements['battery-fill'];
    const batteryRateEl = DOMElements['battery-rate'];
    
    if (!batteryTextEl || !batteryFillEl) {
        logger.warn('Battery display elements not found');
        return null;
    }
    
    // Set to default values
    batteryTextEl.textContent = 'API N/A';
    
    // Check if Battery API is supported
    if (!('getBattery' in navigator)) {
        logger.warn('Battery API not supported');
        return null;
    }
    
    try {
        const battery = await navigator.getBattery();
        
        // Update battery display with initial values
        updateBatteryDisplay(battery);
        
        // Listen for battery events
        battery.addEventListener('chargingchange', () => updateBatteryDisplay(battery));
        battery.addEventListener('levelchange', () => updateBatteryDisplay(battery));
        battery.addEventListener('chargingtimechange', () => updateBatteryDisplay(battery));
        battery.addEventListener('dischargingtimechange', () => updateBatteryDisplay(battery));
        
        // Update user profile if available
        if (window.userProfile && window.userProfile.hardwareProfile) {
            window.userProfile.hardwareProfile.battery = {
                level: battery.level,
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        }
        
        return battery;
    } catch (err) {
        logger.error('Error getting battery info:', err);
        if (batteryTextEl) batteryTextEl.textContent = 'BATTERY ERROR';
        return null;
    }
    
    /**
     * Updates the battery display with current values
     * @param {BatteryManager} battery - The battery manager object
     */
    function updateBatteryDisplay(battery) {
        // Format charging status and level
        const level = Math.round(battery.level * 100);
        const chargingStatus = battery.charging ? 'CHARGING' : 'DISCHARGING';
        
        // Update text display
        if (batteryTextEl) {
            batteryTextEl.textContent = `${level}% ${chargingStatus}`;
        }
        
        // Update visual fill
        if (batteryFillEl) {
            batteryFillEl.style.width = `${level}%`;
            
            // Change color based on level
            if (level <= 20) {
                batteryFillEl.style.backgroundColor = '#FF1744'; // Red for low
            } else if (level <= 50) {
                batteryFillEl.style.backgroundColor = '#FFD700'; // Yellow for medium
            } else {
                batteryFillEl.style.backgroundColor = '#00E676'; // Green for high
            }
        }
        
        // Update charging/discharging rate
        if (batteryRateEl) {
            let rateText = 'N/A';
            
            if (battery.charging && battery.chargingTime !== Infinity) {
                const hoursRemaining = battery.chargingTime / 3600;
                rateText = `FULL IN ~${hoursRemaining.toFixed(1)} HRS`;
            } else if (!battery.charging && battery.dischargingTime !== Infinity) {
                const hoursRemaining = battery.dischargingTime / 3600;
                rateText = `EMPTY IN ~${hoursRemaining.toFixed(1)} HRS`;
            }
            
            batteryRateEl.textContent = rateText;
        }
    }
}

function detectGPUInfo() {
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    logger.debug('Detecting GPU information...');
    const gpuValueEl = DOMElements['gpu-value'];
    
    if (!gpuValueEl) {
        logger.warn('GPU value element not found');
        return null;
    }
    
    // Default value
    gpuValueEl.textContent = 'DETECTING...';
    
    try {
        // Try to get GPU info from WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            gpuValueEl.textContent = 'WEBGL N/A';
            return null;
        }
        
        // Get WebGL vendor and renderer
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        
        if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            // Format the GPU info
            const gpuInfo = `${vendor} ${renderer}`;
            gpuValueEl.textContent = gpuInfo;
            
            // Update user profile if available
            if (window.userProfile && window.userProfile.hardwareProfile) {
                window.userProfile.hardwareProfile.gpu = gpuInfo;
            }
            
            return gpuInfo;
        } else {
            // Fallback to basic info if debug info is not available
            const basicVendor = gl.getParameter(gl.VENDOR);
            const basicRenderer = gl.getParameter(gl.RENDERER);
            
            const gpuInfo = `${basicVendor} ${basicRenderer}`;
            gpuValueEl.textContent = `LIMITED INFO: ${gpuInfo}`;
            
            return gpuInfo;
        }
    } catch (err) {
        logger.error('Error detecting GPU info:', err);
        gpuValueEl.textContent = 'GPU DETECTION ERROR';
        return null;
    }
}

function benchmarkJSPerformance() {
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    logger.debug('Running JavaScript performance benchmark...');
    const performanceEl = DOMElements['js-performance'];
    
    if (!performanceEl) {
        logger.warn('Performance element not found');
        return null;
    }
    
    // Default value
    performanceEl.textContent = 'BENCHMARKING...';
    
    try {
        const iterations = CONFIG?.BENCHMARK_ITERATIONS || 1000000;
        
        // Measure time for a simple arithmetic operation
        const startTime = performance.now();
        let result = 0;
        
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.cos(i) / (1 + Math.sin(i));
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Calculate operations per millisecond
        const opsPerMs = iterations / duration;
        
        // Higher score is better
        const score = Math.round(opsPerMs * 100);
        
        // Format the score with a relative rating
        let rating;
        if (score > 800) {
            rating = 'VERY HIGH';
        } else if (score > 500) {
            rating = 'HIGH';
        } else if (score > 300) {
            rating = 'MEDIUM';
        } else if (score > 100) {
            rating = 'LOW';
        } else {
            rating = 'VERY LOW';
        }
        
        const formattedScore = `${score} (${rating})`;
        performanceEl.textContent = formattedScore;
        
        // Update user profile if available
        if (window.userProfile && window.userProfile.hardwareProfile) {
            window.userProfile.hardwareProfile.jsPerformance = {
                score,
                rating,
                iterationsPerMs: opsPerMs
            };
        }
        
        return score;
    } catch (err) {
        logger.error('Error running JavaScript benchmark:', err);
        performanceEl.textContent = 'BENCHMARK ERROR';
        return null;
    }
}

function performTimingAnalysis() {
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    logger.debug('Performing CPU timing analysis...');
    
    const cpuArchEl = DOMElements['cpu-arch-value'];
    const memoryTimingEl = DOMElements['memory-timing-value'];
    const cacheTimingEl = DOMElements['cache-timing-value'];
    const speculativeExecEl = DOMElements['speculative-exec-value'];
    
    if (!cpuArchEl || !memoryTimingEl || !cacheTimingEl || !speculativeExecEl) {
        logger.warn('CPU analysis elements not found');
        return;
    }
    
    // Set initial values
    cpuArchEl.textContent = 'ANALYZING...';
    memoryTimingEl.textContent = 'ANALYZING...';
    cacheTimingEl.textContent = 'ANALYZING...';
    speculativeExecEl.textContent = 'ANALYZING...';
    
    // This is a simplified demonstration version - in real life, these tests would be much more sophisticated
    
    // Simulated CPU architecture detection
    setTimeout(() => {
        try {
            // Create a large array to force memory allocation
            const arraySize = 10000000;
            const largeArray = new Array(arraySize);
            
            // Fill array
            const startFill = performance.now();
            for (let i = 0; i < arraySize; i++) {
                largeArray[i] = i;
            }
            const endFill = performance.now();
            
            // Sequential access
            const startSeq = performance.now();
            let sum = 0;
            for (let i = 0; i < arraySize; i++) {
                sum += largeArray[i];
            }
            const endSeq = performance.now();
            
            // Random access
            const startRandom = performance.now();
            sum = 0;
            for (let i = 0; i < 1000000; i++) {
                const idx = Math.floor(Math.random() * arraySize);
                sum += largeArray[idx];
            }
            const endRandom = performance.now();
            
            // Calculate timing metrics
            const fillTime = endFill - startFill;
            const seqTime = endSeq - startSeq;
            const randomTime = endRandom - startRandom;
            const randomVsSeqRatio = randomTime / seqTime;
            
            // Update UI with simulated results (based on timing patterns)
            cpuArchEl.textContent = detectCPUArch(fillTime, seqTime);
            memoryTimingEl.textContent = `${seqTime.toFixed(2)}ms SEQ, ${randomTime.toFixed(2)}ms RANDOM`;
            cacheTimingEl.textContent = `RATIO: ${randomVsSeqRatio.toFixed(2)}x (${getCacheAssessment(randomVsSeqRatio)})`;
            speculativeExecEl.textContent = getSpeculativeExecutionStatus(randomVsSeqRatio, seqTime);
            
            // Update user profile if available
            if (window.userProfile && window.userProfile.hardwareProfile) {
                window.userProfile.hardwareProfile.timingAnalysis = {
                    cpuArch: cpuArchEl.textContent,
                    memoryTiming: memoryTimingEl.textContent,
                    cacheTiming: cacheTimingEl.textContent,
                    speculativeExec: speculativeExecEl.textContent
                };
            }
        } catch (err) {
            logger.error('Error in timing analysis:', err);
            cpuArchEl.textContent = 'ANALYSIS ERROR';
            memoryTimingEl.textContent = 'ANALYSIS ERROR';
            cacheTimingEl.textContent = 'ANALYSIS ERROR';
            speculativeExecEl.textContent = 'ANALYSIS ERROR';
        }
    }, 1000);
    
    // Helper functions for CPU analysis interpretation
    function detectCPUArch(fillTime, seqTime) {
        // Note: This is a simplification for demonstration
        if (fillTime < 50 && seqTime < 10) {
            return 'HIGH-END X86-64 (Est.)';
        } else if (fillTime < 100 && seqTime < 30) {
            return 'MID-RANGE X86-64 (Est.)';
        } else if (navigator.userAgent.includes('ARM') || navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
            return 'ARM-BASED (Est.)';
        } else {
            return 'X86-64 (Est.)';
        }
    }
    
    function getCacheAssessment(ratio) {
        if (ratio > 20) {
            return 'SMALL CACHE';
        } else if (ratio > 10) {
            return 'MEDIUM CACHE';
        } else {
            return 'LARGE CACHE';
        }
    }
    
    function getSpeculativeExecutionStatus(ratio, seqTime) {
        // This is a simplification for educational purposes
        // Real detection would be much more complex
        if (seqTime < 10 && ratio < 15) {
            return 'LIKELY ENABLED';
        } else if (seqTime < 30 && ratio < 25) {
            return 'POSSIBLY ENABLED';
        } else {
            return 'LIKELY DISABLED';
        }
    }
}

function analyzeGPUPerformance() {
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    logger.debug('Analyzing GPU performance...');
    const gpuPerfEl = DOMElements['gpu-perf-value'];
    
    if (!gpuPerfEl) {
        logger.warn('GPU performance element not found');
        return;
    }
    
    gpuPerfEl.textContent = 'ANALYZING...';
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            gpuPerfEl.textContent = 'WEBGL N/A';
            return;
        }
        
        // Create a complex scene with many triangles
        const vertexCount = 100000;
        const vertices = new Float32Array(vertexCount * 3);
        
        // Fill with random vertices
        for (let i = 0; i < vertexCount * 3; i++) {
            vertices[i] = Math.random() * 2 - 1; // -1 to 1
        }
        
        // Create vertex buffer
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Create simple shader program
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `
            attribute vec3 position;
            void main() {
                gl_Position = vec4(position, 1.0);
                gl_PointSize = 1.0;
            }
        `);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.5, 0.7, 1.0, 1.0);
            }
        `);
        gl.compileShader(fragmentShader);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        
        const positionAttrib = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionAttrib);
        gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
        
        // Measure rendering performance
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        const iterations = 10;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            gl.drawArrays(gl.POINTS, 0, vertexCount);
        }
        
        // Force GPU to finish
        gl.finish();
        
        const endTime = performance.now();
        const renderTime = (endTime - startTime) / iterations;
        
        // Calculate performance score
        let performanceRating;
        if (renderTime < 5) {
            performanceRating = 'VERY HIGH';
        } else if (renderTime < 15) {
            performanceRating = 'HIGH';
        } else if (renderTime < 30) {
            performanceRating = 'MEDIUM';
        } else if (renderTime < 50) {
            performanceRating = 'LOW';
        } else {
            performanceRating = 'VERY LOW';
        }
        
        gpuPerfEl.textContent = `${performanceRating} (${renderTime.toFixed(2)}ms)`;
        
        // Update user profile if available
        if (window.userProfile && window.userProfile.hardwareProfile) {
            window.userProfile.hardwareProfile.gpuPerformance = {
                rating: performanceRating,
                renderTimeMs: renderTime
            };
        }
    } catch (err) {
        logger.error('Error analyzing GPU performance:', err);
        gpuPerfEl.textContent = 'ANALYSIS ERROR';
    }
}

function detectHardwareVulnerabilities() {
    logger.debug('Simulating hardware vulnerability detection...');
    
    // Simulate detection based on browser and platform
    const vulnerabilities = [];
    
    // Check user agent for device info
    const ua = navigator.userAgent;
    const cpuArchitecture = navigator.userAgent.includes('ARM') ? 'ARM' : 'x86';
    const isOlderDevice = Math.random() < 0.3; // Random for demo purposes
    
    // Spectre/Meltdown simulation
    if (cpuArchitecture === 'x86' && !ua.includes('Firefox/9') && !isOlderDevice) {
        vulnerabilities.push({
            name: 'Spectre',
            severity: 'high',
            description: 'Branch prediction vulnerability allowing memory access across security boundaries'
        });
    }
    
    if (cpuArchitecture === 'x86' && Math.random() < 0.5) { // Random for demo
        vulnerabilities.push({
            name: 'Meltdown',
            severity: 'high',
            description: 'Out-of-order execution vulnerability allowing kernel memory access'
        });
    }
    
    // Rowhammer simulation (more likely on older devices or mobile)
    if (isOlderDevice || ua.includes('Mobile')) {
        vulnerabilities.push({
            name: 'Rowhammer',
            severity: 'medium',
            description: 'DRAM disturbance error allowing bit flips in adjacent memory rows'
        });
    }
    
    // RIDL/Fallout/ZombieLoad (MDS vulnerabilities) simulation
    if (cpuArchitecture === 'x86' && Math.random() < 0.4) { // Random for demo
        vulnerabilities.push({
            name: 'MDS',
            severity: 'medium',
            description: 'Microarchitectural data sampling vulnerability'
        });
    }
    
    // Update UI if elements exist
    // Check for DOMElements via the global DOM cache
    const DOMElements = window.DOMElements || {};
    
    // For example, if there's a hardware-vuln-value element:
    const vulnEl = DOMElements['hardware-vuln-value'];
    if (vulnEl) {
        if (vulnerabilities.length > 0) {
            vulnEl.textContent = `${vulnerabilities.length} POTENTIAL VULNS`;
        } else {
            vulnEl.textContent = 'NONE DETECTED';
        }
    }
    
    // Update user profile if available
    if (window.userProfile && window.userProfile.hardwareProfile) {
        window.userProfile.hardwareProfile.vulnerabilities = vulnerabilities;
    }
    
    return vulnerabilities;
}

// Helper for safe execution (can be moved to core.js later)
function safeExecute(fn) {
    try {
        fn();
    } catch (err) {
        logger.error(`Error executing ${fn.name}:`, err);
    }
}

// Main initialization function
function initializeHardwareAnalysis() {
    if (!appReady) {
        (window.logger || console).warn('Hardware analysis init skipped: App not ready.');
        return;
    }
    if (!window.CONFIG || !window.logger) {
        console.error('Hardware analysis init failed: CONFIG/logger missing.');
        return; 
    }
    logger.info('Executing hardware analysis functions...');
    safeExecute(getBatteryInfo);
    safeExecute(detectGPUInfo);
    safeExecute(benchmarkJSPerformance);
    safeExecute(performTimingAnalysis);
    safeExecute(analyzeGPUPerformance);
    safeExecute(detectHardwareVulnerabilities);
    logger.info('Hardware analysis feature initialization sequence complete.');
}

// Assign functions to the modules namespace AFTER defining them
window.modules.hardwareAnalysis = {
    getBatteryInfo,
    detectGPUInfo,
    benchmarkJSPerformance,
    performTimingAnalysis,
    analyzeGPUPerformance,
    detectHardwareVulnerabilities,
    initializeHardwareAnalysis
};

// Set up app ready listener - THIS IS THE ONLY THING THAT RUNS INITIALLY
window.addEventListener('appInitialized', function() {
    appReady = true;
    (window.logger || console).info('Hardware Analysis: appInitialized received. Initializing...');
    initializeHardwareAnalysis(); 
});

console.log('hardware-analysis.js module parsed'); // Add log to see parsing time