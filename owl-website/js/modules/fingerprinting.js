/**
 * Fingerprinting Module
 * Implements various browser fingerprinting techniques for the Owl Security Scanner
 * This demonstrates how websites can uniquely identify users without cookies
 */


'use strict';

// Import necessary functions and variables
import { dataCollectionHash } from './core.js';
// Assuming logger, DOMElements, etc. are accessed globally or passed differently

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.fingerprinting = window.modules.fingerprinting || {};

/**
 * Main function to collect all fingerprints
 * Coordinates the generation of different fingerprint types
 * @returns {Object} Collected fingerprint data
 */
async function collectFingerprints() {
    try {
        console.log('Collecting browser fingerprints...');
        
        // Canvas fingerprinting
        const canvasFingerprint = generateCanvasFingerprint();
        if (window.DOMElements && window.DOMElements['canvas-value']) {
            window.DOMElements['canvas-value'].textContent = canvasFingerprint;
            window.DOMElements['canvas-value'].classList.add('severity-high');
        }
        
        // WebGL fingerprinting
        const webglFingerprint = await generateWebGLFingerprint();
        if (window.DOMElements && window.DOMElements['webgl-value']) {
            window.DOMElements['webgl-value'].textContent = webglFingerprint;
            window.DOMElements['webgl-value'].classList.add('severity-high');
        }
        
        // Audio fingerprinting
        const audioFingerprint = await generateAudioFingerprint();
        if (window.DOMElements && window.DOMElements['audio-value']) {
            window.DOMElements['audio-value'].textContent = audioFingerprint;
            window.DOMElements['audio-value'].classList.add('severity-high');
        }
        
        // SVG fingerprinting
        const svgFingerprint = generateSVGFingerprint();
        if (window.DOMElements && window.DOMElements['svg-fp-value']) {
            window.DOMElements['svg-fp-value'].textContent = svgFingerprint;
        }
        
        // Localization fingerprinting
        const localeFingerprint = generateLocalizationFingerprint();
        if (window.DOMElements && window.DOMElements['locale-fp-value']) {
            window.DOMElements['locale-fp-value'].textContent = localeFingerprint;
        }
        
        // Font detection
        const detectedFonts = detectFonts();
        
        // Combined fingerprint - use window.dataCollectionHash
        const combinedFingerprint = window.dataCollectionHash ? 
            window.dataCollectionHash(canvasFingerprint + webglFingerprint + audioFingerprint + svgFingerprint + localeFingerprint) :
            dataCollectionHash(canvasFingerprint + webglFingerprint + audioFingerprint + svgFingerprint + localeFingerprint);
        
        if (window.DOMElements && window.DOMElements['fingerprint-value']) {
            window.DOMElements['fingerprint-value'].textContent = combinedFingerprint;
            window.DOMElements['fingerprint-value'].classList.add('data-corruption');
            window.DOMElements['fingerprint-value'].setAttribute('data-text', 'UNIQUE PROFILE DETECTED');
        }
        
        // Collect device and browser information for fingerprint context
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages ? Array.from(navigator.languages) : [],
            deviceMemory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            touchPoints: navigator.maxTouchPoints
        };
        
        // Calculate a risk score based on fingerprint uniqueness
        // This is a simulated score for demonstration
        const uniquenessScore = 9.7; // Scale of 0-10, higher means more unique/identifiable
        const trackingRisk = 8.5;    // Scale of 0-10, higher means higher tracking risk
        const identityExposure = 7.8; // Scale of 0-10, higher means more identifiable
        
        // Compile the complete fingerprint data
        const fingerprintData = {
            canvas: canvasFingerprint,
            webgl: webglFingerprint,
            audio: audioFingerprint,
            svg: svgFingerprint,
            locale: localeFingerprint,
            combined: combinedFingerprint,
            deviceInfo,
            fonts: detectedFonts,
            uniquenessScore,
            trackingRisk,
            identityExposure,
            timestamp: new Date().toISOString(),
            exposedAttributes: [
                'Canvas API', 'WebGL', 'AudioContext', 
                'Installed Fonts', 'Hardware Info', 'Language Settings'
            ],
            potentialTrackers: 17 // Simulated number of trackers that could use this data
        };
        
        // Store in user profile if available
        if (window.userProfile) {
            window.userProfile.fingerprintData = fingerprintData;
            
            // Update privacy metrics
            window.userProfile.privacyMetrics = window.userProfile.privacyMetrics || {};
            window.userProfile.privacyMetrics.fingerprintUniqueness = uniquenessScore * 10; // Convert to 0-100 scale
        }
        
        console.log('Fingerprint collection complete');
        return fingerprintData;
        
    } catch (error) {
        console.error('Error collecting fingerprints:', error);
        return {
            error: error.message,
            errorType: 'FingerprintCollectionError'
        };
    }
}

/**
 * Generates a fingerprint using HTML Canvas
 * @returns {string} Canvas fingerprint hash
 */
export function generateCanvasFingerprint() {
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
        
        // Emoji and special chars for unicode rendering
        ctx.fillStyle = '#2DA9A8';
        ctx.font = '15px Times New Roman';
        ctx.fillText('👁️🔐🌐♛✓', 15, 45);
        
        // Additional shapes for rendering differences
        ctx.beginPath();
        ctx.arc(150, 25, 15, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = '#704E93';
        ctx.fill();
        ctx.strokeStyle = '#59E764';
        ctx.stroke();
        
        // Get the data URL and hash it - use window.dataCollectionHash if available
        const dataURL = canvas.toDataURL();
        return dataCollectionHash(dataURL);
    } catch (e) {
        console.warn('Error generating canvas fingerprint:', e);
        return 'CANVAS_ERROR';
    }
}

/**
 * Generates a fingerprint using WebGL capabilities and rendering
 * @returns {Promise<string>} WebGL fingerprint hash
 */
async function generateWebGLFingerprint() {
    return new Promise(resolve => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            
            // Try to get WebGL context
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                resolve('WEBGL_NOT_SUPPORTED');
                return;
            }
            
            // Collect WebGL information
            const info = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                extensions: gl.getSupportedExtensions(),
                parameters: {}
            };
            
            // Get max dimensions and other parameters
            const parameters = [
                gl.MAX_VERTEX_ATTRIBS,
                gl.MAX_VARYING_VECTORS,
                gl.MAX_VERTEX_UNIFORM_VECTORS,
                gl.MAX_FRAGMENT_UNIFORM_VECTORS,
                gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
                gl.MAX_TEXTURE_SIZE,
                gl.MAX_CUBE_MAP_TEXTURE_SIZE,
                gl.MAX_RENDERBUFFER_SIZE
            ];
            
            parameters.forEach((param, index) => {
                info.parameters[`param${index}`] = gl.getParameter(param);
            });
            
            // Add some simple rendering to increase entropy
            const vertices = new Float32Array([
                -0.7, -0.7, 0,
                0.7, -0.7, 0,
                0, 0.7, 0
            ]);
            
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, `
                attribute vec3 position;
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `);
            gl.compileShader(vertexShader);
            
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(0.8, 0.2, 0.5, 1.0);
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
            
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            
            // Get pixel data for additional entropy
            const pixels = new Uint8Array(4);
            gl.readPixels(10, 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            info.pixelSample = Array.from(pixels).join(',');
            
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                const imageData = canvas.toDataURL();
                const combinedData = JSON.stringify(info) + imageData;
                
                // Use window.dataCollectionHash if available
                resolve(dataCollectionHash(combinedData));
            }, 50);
            
        } catch (e) {
            console.warn('Error generating WebGL fingerprint:', e);
            resolve('WEBGL_ERROR');
        }
    });
}

/**
 * Generates a fingerprint using Audio API
 * @returns {Promise<string>} Audio fingerprint hash
 */
async function generateAudioFingerprint() {
    return new Promise(resolve => {
        try {
            // Check if AudioContext is available
            if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
                resolve('AUDIO_API_NOT_SUPPORTED');
                return;
            }
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();
            
            // Create an oscillator configuration
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'triangle'; // Using triangle wave for more variation
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
            
            // Create a dynamic compressor for additional processing variability
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
            compressor.knee.setValueAtTime(40, audioContext.currentTime);
            compressor.ratio.setValueAtTime(12, audioContext.currentTime);
            compressor.attack.setValueAtTime(0, audioContext.currentTime);
            compressor.release.setValueAtTime(0.25, audioContext.currentTime);
            
            // Create analyser for output processing
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            
            // Connect the nodes
            oscillator.connect(compressor);
            compressor.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Start oscillator for short duration
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            
            // Process the audio data after a short delay
            setTimeout(() => {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                
                // Sample portions of the frequency data to reduce size but maintain fingerprinting
                const sampledData = [];
                const step = Math.max(1, Math.floor(dataArray.length / 20));
                
                for (let i = 0; i < dataArray.length; i += step) {
                    sampledData.push(dataArray[i]);
                }
                
                // Get compressor parameters for additional entropy
                const compressorInfo = {
                    reduction: compressor.reduction.value,
                    threshold: compressor.threshold.value,
                    knee: compressor.knee.value,
                    ratio: compressor.ratio.value
                };
                
                // Combine all audio context information
                const audioInfo = {
                    sampleRate: audioContext.sampleRate,
                    destination: {
                        maxChannelCount: audioContext.destination.maxChannelCount,
                        numberOfInputs: audioContext.destination.numberOfInputs,
                        numberOfOutputs: audioContext.destination.numberOfOutputs
                    },
                    compressor: compressorInfo,
                    frequencySample: sampledData
                };
                
                // Close audio context when done
                audioContext.close().then(() => {
                    // Use window.dataCollectionHash if available
                    const fingerprint = dataCollectionHash(JSON.stringify(audioInfo));
                    resolve(fingerprint);
                });
            }, 100);
            
        } catch (e) {
            console.warn('Error generating audio fingerprint:', e);
            resolve('AUDIO_ERROR');
        }
    });
}

/**
 * Generates SVG fingerprint
 * @returns {string} SVG fingerprint hash
 */
export function generateSVGFingerprint() {
    try {
        // Create SVG element
        const xmlns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(xmlns, 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '100');
        svg.style.position = 'absolute';
        svg.style.visibility = 'hidden';
        
        // Add a complex path
        const path = document.createElementNS(xmlns, 'path');
        path.setAttribute('d', 'M10,10 C20,20 40,20 50,10 C60,0 80,0 90,10 L90,50 C80,40 60,40 50,50 C40,60 20,60 10,50 L10,10');
        path.setAttribute('fill', '#A855F7');
        path.setAttribute('stroke', '#00FFFF');
        path.setAttribute('stroke-width', '1');
        
        // Add text element
        const text = document.createElementNS(xmlns, 'text');
        text.setAttribute('x', '50');
        text.setAttribute('y', '70');
        text.setAttribute('font-family', 'Arial');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#FF0055');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = 'SVG Fingerprint';
        
        // Add a linear gradient
        const defs = document.createElementNS(xmlns, 'defs');
        const linearGradient = document.createElementNS(xmlns, 'linearGradient');
        linearGradient.setAttribute('id', 'gradient');
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '100%');
        linearGradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS(xmlns, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#8A2BE2');
        
        const stop2 = document.createElementNS(xmlns, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#00FFFF');
        
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        defs.appendChild(linearGradient);
        
        // Add a rectangle with gradient
        const rect = document.createElementNS(xmlns, 'rect');
        rect.setAttribute('x', '10');
        rect.setAttribute('y', '80');
        rect.setAttribute('width', '180');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', 'url(#gradient)');
        
        // Add a circle element
        const circle = document.createElementNS(xmlns, 'circle');
        circle.setAttribute('cx', '160');
        circle.setAttribute('cy', '30');
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', '#4B0082');
        circle.setAttribute('stroke', '#FF0055');
        circle.setAttribute('stroke-width', '2');
        
        // Add all elements to SVG
        svg.appendChild(defs);
        svg.appendChild(rect);
        svg.appendChild(path);
        svg.appendChild(circle);
        svg.appendChild(text);
        
        // Add to document, render, and then remove
        document.body.appendChild(svg);
        const svgData = new XMLSerializer().serializeToString(svg);
        document.body.removeChild(svg);
        
        // Use window.dataCollectionHash if available
        return dataCollectionHash(svgData);
    } catch (e) {
        console.warn('Error generating SVG fingerprint:', e);
        return 'SVG_ERROR';
    }
}

/**
 * Detect browser fonts using various methods
 */
function detectFonts() {
    try {
        const fontList = [];
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = 'mmmmmmmmMMMMMMll';
        const testSize = '72px';
        const h = document.getElementsByTagName('body')[0];
        
        // Create a container for the test elements
        const fontTestContainer = document.createElement('div');
        fontTestContainer.style.position = 'absolute';
        fontTestContainer.style.left = '-9999px';
        fontTestContainer.style.visibility = 'hidden';
        
        // Create spans for the base fonts
        const spans = {};
        for (let i = 0; i < baseFonts.length; i++) {
            const span = document.createElement('span');
            span.style.fontFamily = baseFonts[i];
            span.style.fontSize = testSize;
            span.innerHTML = testString;
            fontTestContainer.appendChild(span);
            spans[baseFonts[i]] = span;
        }
        
        h.appendChild(fontTestContainer);
        
        // Get initial dimensions for base fonts
        const baseDimensions = {};
        for (let i = 0; i < baseFonts.length; i++) {
            const baseFont = baseFonts[i];
            baseDimensions[baseFont] = {
                width: spans[baseFont].offsetWidth,
                height: spans[baseFont].offsetHeight
            };
        }
        
        // List of fonts to detect
        const fontsToDetect = [
            // Windows fonts
            'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS',
            'Consolas', 'Courier', 'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
            'Microsoft Sans Serif', 'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
            // macOS fonts
            'American Typewriter', 'Andale Mono', 'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
            'Baskerville', 'Brush Script MT', 'Chalkboard', 'Copperplate', 'Courier New', 'Didot', 'Futura',
            'Geneva', 'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Herculanum', 'Lucida Grande', 'Menlo',
            'Monaco', 'Optima', 'Palatino', 'Papyrus', 'Skia', 'Times', 'Times New Roman', 'Trebuchet MS',
            'Verdana', 'Zapfino',
            // Linux fonts
            'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'Liberation Mono', 'Liberation Sans',
            'Liberation Serif', 'Noto Sans', 'Ubuntu', 'Ubuntu Condensed',
            // Web-safe fonts
            'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Oswald', 'Raleway', 'PT Sans',
            'Nunito', 'Merriweather', 'Poppins'
        ];
        
        const detectedFonts = [];
        
        for (let i = 0; i < fontsToDetect.length; i++) {
            const font = fontsToDetect[i];
            let detected = false;
            
            // Test against each base font
            for (let j = 0; j < baseFonts.length; j++) {
                const baseFont = baseFonts[j];
                const testSpan = document.createElement('span');
                testSpan.style.fontFamily = `'${font}', ${baseFont}`;
                testSpan.style.fontSize = testSize;
                testSpan.innerHTML = testString;
                fontTestContainer.appendChild(testSpan);
                
                // Compare dimensions with base font
                const fontDimensions = {
                    width: testSpan.offsetWidth,
                    height: testSpan.offsetHeight
                };
                
                if (
                    fontDimensions.width !== baseDimensions[baseFont].width ||
                    fontDimensions.height !== baseDimensions[baseFont].height
                ) {
                    detected = true;
                    break;
                }
                
                fontTestContainer.removeChild(testSpan);
            }
            
            if (detected) {
                detectedFonts.push(font);
            }
            
            // Stop if we've detected enough fonts (for performance)
            if (detectedFonts.length >= window.CONFIG.FONT_TEST_LIMIT) {
                detectedFonts.push(`... and more (limited to ${window.CONFIG.FONT_TEST_LIMIT})`);
                break;
            }
        }
        
        h.removeChild(fontTestContainer);
        
        // Update UI
        if (window.DOMElements && window.DOMElements['fonts-value']) {
            if (detectedFonts.length === 0) {
                window.DOMElements['fonts-value'].textContent = 'FONT DETECTION BLOCKED';
            } else {
                window.DOMElements['fonts-value'].textContent = 
                    `${detectedFonts.length} fonts: ${detectedFonts.slice(0, 8).join(', ')}...`;
                
                // Set high severity if many fonts detected (high entropy)
                if (detectedFonts.length > 20) {
                    window.DOMElements['fonts-value'].classList.add('severity-high');
                } else if (detectedFonts.length > 10) {
                    window.DOMElements['fonts-value'].classList.add('severity-medium');
                }
            }
        }
        
        // Update global user profile
        if (window.userProfile) {
            window.userProfile.fontList = detectedFonts;
        }
        
        // Return for further processing
        return detectedFonts;
    } catch (e) {
        console.warn('Error detecting fonts:', e);
        if (window.DOMElements && window.DOMElements['fonts-value']) {
            window.DOMElements['fonts-value'].textContent = 'FONT DETECTION ERROR';
        }
        return [];
    }
}

/**
 * Generates a fingerprint based on browser's localization/internationalization APIs
 * Analyzes Intl API behavior, date/time/number formatting, and language preferences
 * @returns {string} Localization fingerprint hash
 */
export function generateLocalizationFingerprint() {
    try {
        // Collect data from various localization APIs
        const localeData = {
            language: navigator.language,
            languages: navigator.languages ? Array.from(navigator.languages) : [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateTimeFormat: Intl.DateTimeFormat().resolvedOptions(),
            
            // Date formats across different locales
            dateFormats: {
                'en-US': new Intl.DateTimeFormat('en-US').format(new Date()),
                'ja-JP': new Intl.DateTimeFormat('ja-JP').format(new Date()),
                'de-DE': new Intl.DateTimeFormat('de-DE').format(new Date()),
                'ar-SA': new Intl.DateTimeFormat('ar-SA').format(new Date()),
                'zh-CN': new Intl.DateTimeFormat('zh-CN').format(new Date())
            },
            
            // Number formats across different locales
            numberFormats: {
                'en-US': new Intl.NumberFormat('en-US').format(1234567.89),
                'fr-FR': new Intl.NumberFormat('fr-FR').format(1234567.89),
                'de-DE': new Intl.NumberFormat('de-DE').format(1234567.89),
                'ja-JP': new Intl.NumberFormat('ja-JP').format(1234567.89),
                'en-IN': new Intl.NumberFormat('en-IN').format(1234567.89)
            },
            
            // Currency formats
            currencyFormats: {
                'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.56),
                'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.56),
                'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(1234.56),
                'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(1234.56)
            },
            
            // Available locales
            availableLocales: Intl.DateTimeFormat.supportedLocalesOf(['en-US', 'fr-FR', 'de-DE', 'ja-JP', 'ar-SA', 'zh-CN'])
        };
        
        // Get collation behavior (sorting of strings) 
        try {
            const collator = new Intl.Collator();
            const testStrings = ['a', 'b', 'c', 'A', 'B', 'C', 'ä', 'ö', 'ü', 'ß', '你', '好', 'эй'];
            const sortedStrings = [...testStrings].sort(collator.compare);
            localeData.collation = sortedStrings.join(',');
        } catch (e) {
            localeData.collation = 'error';
        }
        
        // Test case conversion behavior
        localeData.caseConversion = {
            upper: 'Istanbul'.toLocaleUpperCase(),
            lower: 'Istanbul'.toLocaleLowerCase()
        };
        
        // Display computed locale fingerprint data in UI
        if (window.DOMElements && window.DOMElements['locale-fp-value']) {
            // Use window.dataCollectionHash if available
            const localeString = Object.values(localeData).join('|');
            const localeHash = dataCollectionHash(localeString);
            window.DOMElements['locale-fp-value'].textContent = localeHash;
            return localeHash;
        }
        
        // Use window.dataCollectionHash if available
        return dataCollectionHash(JSON.stringify(localeData));
    } catch (e) {
        console.warn('Error generating localization fingerprint:', e);
        if (window.DOMElements && window.DOMElements['locale-fp-value']) {
            window.DOMElements['locale-fp-value'].textContent = 'LOCALE_ERROR';
        }
        return 'LOCALE_ERROR';
    }
}

// Export additional fingerprinting functions as needed

/**
 * Analyzes file metadata for a selected file
 */
function analyzeFileMetadata() {
    try {
        console.log('Analyzing file metadata...');
        
        if (!window.DOMElements || !window.DOMElements['file-meta-value']) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Check if the File API is supported
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            window.DOMElements['file-meta-value'].textContent = 'FILE API NOT SUPPORTED';
            if (window.DOMElements['file-meta-status-note']) {
                window.DOMElements['file-meta-status-note'].textContent = 'Browser does not support File API';
                window.DOMElements['file-meta-status-note'].classList.add('error-note');
            }
            return;
        }
        
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            if (!this.files || this.files.length === 0) {
                window.DOMElements['file-meta-value'].textContent = 'NO FILE SELECTED';
                document.body.removeChild(fileInput);
                return;
            }
            
            const file = this.files[0];
            const fileMetadata = {
                name: file.name,
                type: file.type || 'unknown',
                size: file.size,
                lastModified: new Date(file.lastModified).toISOString(),
                hash: dataCollectionHash(file.name + file.size + file.lastModified)
            };
            
            // Display file metadata
            window.DOMElements['file-meta-value'].textContent = 
                `${fileMetadata.name} (${formatFileSize(fileMetadata.size)})`;
            window.DOMElements['file-meta-value'].classList.add('severity-medium');
            
            if (window.DOMElements['file-meta-status-note']) {
                window.DOMElements['file-meta-status-note'].textContent = 
                    `Type: ${fileMetadata.type}, Modified: ${new Date(file.lastModified).toLocaleString()}`;
                window.DOMElements['file-meta-status-note'].classList.remove('error-note');
            }
            
            // Store in user profile if available
            if (window.userProfile) {
                window.userProfile.fileMetadata = fileMetadata;
            }
            
            document.body.removeChild(fileInput);
        });
        
        // Trigger file selection dialog
        fileInput.click();
        
    } catch (e) {
        console.error('Error analyzing file metadata:', e);
        if (window.DOMElements && window.DOMElements['file-meta-value']) {
            window.DOMElements['file-meta-value'].textContent = 'ANALYSIS ERROR';
        }
    }
}

/**
 * Helper function to format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Saves a summary of the collected information to a file
 */
function saveSummaryToFile() {
    try {
        console.log('Saving summary to file...');
        
        if (!window.DOMElements || !window.DOMElements['save-file-value']) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Check if the necessary APIs are available
        if (!window.Blob || !window.URL || !window.URL.createObjectURL) {
            window.DOMElements['save-file-value'].textContent = 'BROWSER API NOT SUPPORTED';
            if (window.DOMElements['save-file-status-note']) {
                window.DOMElements['save-file-status-note'].textContent = 'Browser does not support necessary APIs';
                window.DOMElements['save-file-status-note'].classList.add('error-note');
            }
            return;
        }
        
        // Prepare the data to be saved
        const summary = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                pixelRatio: window.devicePixelRatio
            },
            language: navigator.language,
            languages: navigator.languages ? Array.from(navigator.languages) : [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack,
            pluginsCount: navigator.plugins ? navigator.plugins.length : 0,
            deviceMemory: navigator.deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        // Add fingerprint data if available
        if (window.userProfile && window.userProfile.fingerprintData) {
            summary.fingerprints = window.userProfile.fingerprintData;
        } else {
            // Try to get fingerprints from DOM if available
            const fingerprints = {};
            if (window.DOMElements['canvas-value']) {
                fingerprints.canvas = window.DOMElements['canvas-value'].textContent;
            }
            if (window.DOMElements['webgl-value']) {
                fingerprints.webgl = window.DOMElements['webgl-value'].textContent;
            }
            if (window.DOMElements['audio-value']) {
                fingerprints.audio = window.DOMElements['audio-value'].textContent;
            }
            if (window.DOMElements['fingerprint-value']) {
                fingerprints.combined = window.DOMElements['fingerprint-value'].textContent;
            }
            summary.fingerprints = fingerprints;
        }
        
        // Convert to formatted JSON
        const jsonData = JSON.stringify(summary, null, 2);
        
        // Create a Blob and generate download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `owl-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        
        // Trigger the download
        a.click();
        
        // Clean up
        window.setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        // Update UI
        window.DOMElements['save-file-value'].textContent = 'SUMMARY SAVED';
        window.DOMElements['save-file-value'].classList.add('severity-low');
        
        if (window.DOMElements['save-file-status-note']) {
            window.DOMElements['save-file-status-note'].textContent = 
                `Saved as ${a.download}`;
            window.DOMElements['save-file-status-note'].classList.remove('error-note');
        }
        
    } catch (e) {
        console.error('Error saving summary to file:', e);
        if (window.DOMElements && window.DOMElements['save-file-value']) {
            window.DOMElements['save-file-value'].textContent = 'SAVE ERROR';
            if (window.DOMElements['save-file-status-note']) {
                window.DOMElements['save-file-status-note'].textContent = 
                    `Error: ${e.message || 'Unknown error'}`;
                window.DOMElements['save-file-status-note'].classList.add('error-note');
            }
        }
    }
}

// Make all functions available through the modules namespace
window.modules.fingerprinting = {
    // Main functions
    collectFingerprints,
    generateCanvasFingerprint,
    generateWebGLFingerprint,
    generateAudioFingerprint,
    generateSVGFingerprint,
    generateLocalizationFingerprint,
    
    // Font detection
    detectFonts,
    
    // File operations
    analyzeFileMetadata,
    saveSummaryToFile
};

// Expose functions globally for compatibility or direct access if needed
window.collectFingerprints = collectFingerprints;
window.generateCanvasFingerprint = generateCanvasFingerprint;
window.generateWebGLFingerprint = generateWebGLFingerprint;
window.generateAudioFingerprint = generateAudioFingerprint;
window.generateLocalizationFingerprint = generateLocalizationFingerprint;
window.detectFonts = detectFonts;
window.analyzeFileMetadata = analyzeFileMetadata;
window.saveSummaryToFile = saveSummaryToFile;

// Log initialization
if (typeof window.logger !== 'undefined') {
    window.logger.info('Fingerprinting module initialized.');
} else {
    console.info('[INF] Fingerprinting module initialized.');
}

// Export functions for use in other modules
export {
    collectFingerprints,
    generateCanvasFingerprint,
    generateWebGLFingerprint,
    generateAudioFingerprint,
    generateSVGFingerprint,
    generateLocalizationFingerprint,
    detectFonts,
    analyzeFileMetadata,
    saveSummaryToFile
};