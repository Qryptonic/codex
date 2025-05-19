// js/modules/browser-interfaces.js - Browser interface functions

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.browserInterfaces = window.modules.browserInterfaces || {};

/**
 * Checks WebAuthn (FIDO) support
 */
function checkWebAuthnSupport() {
    console.log('Checking WebAuthn support...');
    if (!window.PublicKeyCredential) {
        console.error('WebAuthn API not supported');
        return false;
    }
    return true;
}

/**
 * Checks for payment method support
 */
function checkPaymentMethodSupport() {
    console.log('Checking payment method support...');
    if (!window.PaymentRequest) {
        console.error('Payment Request API not supported');
        return false;
    }
    return true;
}

/**
 * Writes data to clipboard
 */
function writeToClipboard(text = 'Copied from Owl Demo') {
    console.log('Writing to clipboard...');
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        console.error('Clipboard API not supported');
        return false;
    }
    
    try {
        navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        console.error('Error writing to clipboard:', e);
        return false;
    }
}

/**
 * Requests screen capture
 */
function requestScreenCapture() {
    console.log('Requesting screen capture...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.error('Screen Capture API not supported');
        return;
    }
    // Implementation details would go here
}

// Make all functions available through the modules namespace
window.modules.browserInterfaces = {
    checkWebAuthnSupport,
    checkPaymentMethodSupport,
    writeToClipboard,
    requestScreenCapture
};

// Also expose directly on window for backward compatibility
window.checkWebAuthnSupport = checkWebAuthnSupport;
window.checkPaymentMethodSupport = checkPaymentMethodSupport;
window.writeToClipboard = writeToClipboard;
window.requestScreenCapture = requestScreenCapture;