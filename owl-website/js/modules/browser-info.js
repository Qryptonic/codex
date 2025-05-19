// js/modules/browser-info.js - Browser information detection

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.browserInfo = {}; // Initialize namespace

let appReady = false;

// --- Function Definitions ---

/**
 * Attempts to detect browser extensions
 * (Should only run after app is initialized)
 */
function detectExtensions() {
    if (!appReady) {
        (window.logger || console).warn('detectExtensions called before app was ready.');
        return null;
    }
    (window.logger || console).info('Detecting browser extensions...');
    
    const extensionIndicators = {
        hasChrome: !!window.chrome,
        hasMozilla: typeof InstallTrigger !== 'undefined',
    };
    
    // Safely update the UI
    try {
        const pluginsEl = window.DOMElements?.['plugins-value']; // Optional chaining
        if (pluginsEl) {
            const count = Object.values(extensionIndicators).filter(Boolean).length;
            pluginsEl.textContent = `${count} EXTENSIONS DETECTED (Simulated)`; // Clarify simulation
            
            // Set severity safely
            pluginsEl.classList.remove('severity-low', 'severity-medium', 'severity-high');
            if (count > 5) {
                pluginsEl.classList.add('severity-high');
            } else if (count > 2) {
                pluginsEl.classList.add('severity-medium');
            } else {
                pluginsEl.classList.add('severity-low');
            }
        }
    } catch (e) {
        (window.logger || console).error('Error updating UI with extension data:', e);
    }
    
    return extensionIndicators;
}

// --- Initialization Logic ---

function initializeBrowserInfo() {
     if (!appReady) {
        (window.logger || console).warn('Browser info init skipped: App not ready.');
        return;
    }
    if (!window.CONFIG || !window.logger) {
        console.error('Browser info init failed: CONFIG/logger missing.');
        return; 
    }
    logger.info('Initializing Browser Info features...');
    safeExecute(detectExtensions); // Add other browser info functions here
    logger.info('Browser Info initialization sequence complete.');
}

// Helper for safe execution
function safeExecute(fn) {
    try {
        fn();
    } catch (err) {
        (window.logger || console).error(`Error executing ${fn.name}:`, err);
    }
}

// --- Assign to Namespace & Global Scope --- 
window.modules.browserInfo = {
    detectExtensions,
    initializeBrowserInfo
};
window.detectExtensions = detectExtensions; // Keep global for compatibility if needed

// --- Event Listener --- 
window.addEventListener('appInitialized', function() {
    appReady = true;
    (window.logger || console).info('Browser Info: appInitialized received. Initializing...');
    initializeBrowserInfo(); 
});

console.log('browser-info.js module parsed');
