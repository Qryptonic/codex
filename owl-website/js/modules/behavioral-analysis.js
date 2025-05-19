// js/modules/behavioral-analysis.js - User behavior tracking and analysis

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.behavioralAnalysis = {}; // Initialize namespace

// Use the global dataCollectionHash function with simple fallback
const _dataCollectionHash = window.dataCollectionHash || function(input) {
    console.warn('Using simple fallback hash in behavioral-analysis.js');
    return String(input).length;
};

// --- Module State ---
let cursorData = [];
let scrollPositions = [];
let keyTimingsLog = [];
let clickData = [];
let touchCount = 0;
let lastTouchEnd = null;
let formInteractionStart = null;
let lastMouseMoveTime = 0;
let lastScrollTime = 0;
let behaviorIntervals = [];
let appReady = false;

// --- Function Definitions ---

// Combined initialization function (Called by event listener)
function initializeBehavioralAnalysis() {
    if (!appReady) {
        (window.logger || console).warn('Behavioral analysis init skipped: App not ready.');
        return;
    }
    if (!window.CONFIG || !window.logger) {
        console.error('Behavioral analysis init failed: CONFIG/logger missing.');
        return;
    }
    logger.info('Initializing behavioral analysis state and listeners...');
    initBehavioralAnalysisState(); // Initialize state first
    setupBehaviorListeners();      // Then setup listeners
    logger.info('Behavioral analysis initialized.');
}

// State initializer
function initBehavioralAnalysisState() {
    logger.info('Initializing behavioral analysis state...');
    cursorData = [];
    scrollPositions = [];
    keyTimingsLog = [];
    clickData = [];
    touchCount = 0;
    lastTouchEnd = null;
    formInteractionStart = null;
    lastMouseMoveTime = 0;
    lastScrollTime = 0;
    behaviorIntervals.forEach(clearInterval);
    behaviorIntervals = [];
    const behavioralData = {
        cursorMovement: {
            pattern: 'Initializing...',
            velocity: 0,
            acceleration: 0,
            pathLength: 0
        },
        scrolling: {
            depth: 0,
            frequency: 0,
            pattern: 'Initializing...'
        },
        keyboardDynamics: {
            typingSpeed: 0,
            rhythmPattern: 'Initializing...',
            repeatRate: 0
        },
        clickBehavior: {
            frequency: 0,
            doubleClickRate: 0,
            accuracy: 0
        },
        touchBehavior: {
            frequency: 0,
            multiTouchRate: 0,
            gestureComplexity: 0
        },
        formInteraction: {
            completionTime: 0,
            correctionRate: 0,
            hesitationPattern: 'Initializing...'
        }
    };
    if (window.userProfile) {
        window.userProfile.behavioralData = behavioralData;
    }
    logger.info('Behavioral analysis state reset.');
}

// Listener setup
function setupBehaviorListeners() {
    if (!appReady) {
         console.warn('Attempting to set up behavioral listeners before app is ready. Aborting.');
        return;
    }
    if (!window.CONFIG || !window.logger) {
         (window.logger || console).error('Cannot setup behavioral listeners: CONFIG/logger not found');
        return;
    } 
    logger.info('Setting up behavioral listeners...');
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    const analysisInterval = setInterval(analyzeBehaviorData, 5000); // Make interval configurable?
    behaviorIntervals.push(analysisInterval);
    logger.info('Behavior listeners setup complete.');
}

// Cleanup function
function cleanupBehaviorListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    behaviorIntervals.forEach(clearInterval);
    behaviorIntervals = [];
    console.log('Behavior listeners cleaned up');
}

// --- Event Handlers ---
function handleMouseMove(e) {
    const now = performance.now();
    if (now - lastMouseMoveTime < (window.CONFIG?.dataCollection?.MOUSE_THROTTLE_MS || 100)) return;
    lastMouseMoveTime = now;
    const x = e.clientX;
    const y = e.clientY;
    if (window.DOMElements && window.DOMElements['cursor-position']) {
        window.DOMElements['cursor-position'].textContent = `${x},${y}`;
    }
    cursorData.push({ x, y, time: now });
    if (cursorData.length > (window.CONFIG?.dataCollection?.CURSOR_DATA_LIMIT || 40)) {
        cursorData.shift();
    }
}

function handleScroll() {
    const now = performance.now();
    if (now - lastScrollTime < (window.CONFIG?.dataCollection?.SCROLL_THROTTLE_MS || 180)) return;
    lastScrollTime = now;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollDepthPercent = Math.round((scrollY + windowHeight) / documentHeight * 100);
    if (window.DOMElements && window.DOMElements['scroll-depth']) {
        window.DOMElements['scroll-depth'].textContent = `${scrollDepthPercent}%`;
    }
    scrollPositions.push({ y: scrollY, depth: scrollDepthPercent, time: now });
    if (scrollPositions.length > (window.CONFIG?.dataCollection?.SCROLL_DATA_LIMIT || 30)) {
        scrollPositions.shift();
    }
}

function handleClick(e) {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    const target = e.target;
    const targetInfo = { tag: target.tagName.toLowerCase(), id: target.id || 'none', type: target.type || 'none' };
    clickData.push({ x, y, time: now, target: targetInfo });
    analyzeClickPatterns();
}

function handleKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const now = performance.now();
    const key = window.CONFIG?.SANITIZE_KEYSTROKES ? '*' : e.key;
    keyTimingsLog.push({ key, code: e.code, type: 'down', time: now, target: e.target.tagName.toLowerCase() });
    const maxLines = window.CONFIG?.MAX_KEYSTROKE_LINES || 8;
    if (window.DOMElements && window.DOMElements['keystrokeAnalysis']) {
        updateKeystrokeLog(maxLines);
    }
    analyzeTypingPatterns();
}

function handleKeyUp(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const now = performance.now();
    const key = window.CONFIG?.SANITIZE_KEYSTROKES ? '*' : e.key;
    keyTimingsLog.push({ key, code: e.code, type: 'up', time: now });
    analyzeTypingPatterns();
}

function handleTouchStart(e) {
    const touchPoints = e.touches.length;
    touchCount++;
    if (window.DOMElements && window.DOMElements['touch-patterns']) {
        window.DOMElements['touch-patterns'].textContent = `${touchCount} TOUCHES, ${touchPoints} FINGERS`;
    }
}

function handleTouchEnd() {
    const now = performance.now();
    if (lastTouchEnd && (now - lastTouchEnd < 300)) {
        if (window.DOMElements && window.DOMElements['touch-patterns']) {
            const currentText = window.DOMElements['touch-patterns'].textContent;
            window.DOMElements['touch-patterns'].textContent = `${currentText} (DOUBLE-TAP)`;
        }
    }
    lastTouchEnd = now;
}

// --- Analysis Functions ---
function updateKeystrokeLog(maxLines) {
    const logElement = window.DOMElements['keystrokeAnalysis'];
    if (!logElement) return;
    logElement.innerHTML = '';
    const relevantEntries = keyTimingsLog.filter(entry => entry.type === 'down').slice(-maxLines);
    relevantEntries.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'keylog-entry';
        const timeStr = (entry.time / 1000).toFixed(2);
        logEntry.textContent = `${timeStr}s: ${entry.key} (${entry.code}) [${entry.target}]`;
        logElement.appendChild(logEntry);
    });
}

function analyzeMouseMovements() { /* ... logic ... */ return { pattern: '...', velocity: 0, acceleration: 0, pathLength: 0 }; }
function analyzeTypingPatterns() { /* ... logic ... */ return { typingSpeed: 0, rhythmPattern: '...', consistency: 0, burstRate: 0 }; }
function analyzeClickPatterns() { /* ... logic ... */ return { pattern: '...', frequency: 0, doubleClickRate: 0, accuracy: 0 }; }
function analyzeBehaviorData() { /* ... logic ... */ }
function createBehavioralProfile() { /* ... logic ... */ return { overall: '...', movement: '...', interaction: '...', decision: '...' }; }
function performBehavioralAnalysis() { /* ... logic ... */ return { status: '...', summary: '...', profile: {}, mouseAnalysis: {}, typingAnalysis: {}, clickAnalysis: {}, confidence: 0, identifiability: 0 }; }

// --- Assign to Namespace --- 
window.modules.behavioralAnalysis = {
    initializeBehavioralAnalysis,
    initBehavioralAnalysisState,
    setupBehaviorListeners,
    cleanupBehaviorListeners,
    performBehavioralAnalysis
};

// --- Event Listener (Runs on initial parse) --- 
window.addEventListener('appInitialized', function() {
    appReady = true;
    (window.logger || console).info('Behavioral Analysis: appInitialized received. Initializing...');
    initializeBehavioralAnalysis();
});

console.log('behavioral-analysis.js module parsed');