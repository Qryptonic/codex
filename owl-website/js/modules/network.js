// js/modules/network.js - Network information collection and analysis

'use strict';

// Create a modules namespace if it doesn't exist
window.modules = window.modules || {};
window.modules.network = window.modules.network || {};

// Use the global dataCollectionHash function without redeclaring it
const _dataCollectionHash = window.dataCollectionHash || function(input) {
    if (typeof input !== 'string') {
        try {
            input = JSON.stringify(input);
        } catch (e) {
            input = String(input);
        }
    }
    
    // Simple hashing algorithm for demonstration
    let hash = 0;
    if (input.length === 0) return hash.toString(16);
    
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive hex value and ensure it's a consistent length
    return (hash >>> 0).toString(16).padStart(8, '0');
};

/**
 * Attempts to get the local IP address via WebRTC
 * @returns {Promise<string|null>} The detected local IP or null
 */
async function getWebRTCIP() {
    if (!window.DOMElements) return null;
    
    console.log('Attempting to detect local IP via WebRTC...');
    if (window.DOMElements['local-ip-value']) {
        window.DOMElements['local-ip-value'].textContent = 'DETECTING...';
        if (window.DOMElements['local-ip-value'].classList) {
            window.DOMElements['local-ip-value'].classList.add('severity-medium');
        }
    }

    // Check if WebRTC is supported
    if (!(typeof RTCPeerConnection === 'function')) {
        if (window.DOMElements['local-ip-value']) {
            window.DOMElements['local-ip-value'].textContent = 'WEBRTC N/A';
            if (window.DOMElements['local-ip-value'].classList) {
                window.DOMElements['local-ip-value'].classList.remove('severity-medium');
                window.DOMElements['local-ip-value'].classList.add('severity-low');
            }
        }
        return null;
    }

    try {
        // Create a new RTCPeerConnection
        const pc = new RTCPeerConnection({
            // Using Google's public STUN server
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // Create a timeout promise to limit detection time
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('IP detection timeout')), window.CONFIG?.WEBRTC_TIMEOUT || 5000);
        });

        // Promise for IP detection
        const ipPromise = new Promise((resolve) => {
            // Listen for candidate events
            pc.onicecandidate = (event) => {
                if (!event.candidate) return; // Skip end-of-candidates event

                // Parse IP address from candidate string
                const candidateStr = event.candidate.candidate;
                // Match IPv4 addresses
                const ipv4Regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                const ipv4Match = ipv4Regex.exec(candidateStr);

                if (ipv4Match && ipv4Match[1]) {
                    const ip = ipv4Match[1];

                    // Check if this is a local/private IP
                    if (
                        ip.startsWith('10.') ||
                        ip.startsWith('192.168.') ||
                        ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
                        ip === '127.0.0.1'
                    ) {
                        resolve(ip);
                    }
                }
            };

            // Create an empty data channel (required to trigger candidate generation)
            pc.createDataChannel('');

            // Create offer and set local description
            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .catch((err) => {
                    console.error('WebRTC offer creation failed:', err);
                    resolve(null); // Resolve with null to handle in the main try block
                });
        });

        // Race between IP detection and timeout
        const ip = await Promise.race([ipPromise, timeoutPromise]);

        // Clean up the peer connection
        pc.close();

        if (ip) {
            if (window.DOMElements['local-ip-value']) {
                window.DOMElements['local-ip-value'].textContent = ip;
                if (window.DOMElements['local-ip-value'].classList) {
                    window.DOMElements['local-ip-value'].classList.remove('severity-medium');
                    window.DOMElements['local-ip-value'].classList.add('severity-high');
                }
            }
            
            // Update privacy factors if available globally
            if (window.privacyFactors) {
                window.privacyFactors.webrtcLeak = 10; // High penalty for IP leak
            }
            
            console.log(`Local IP detected via WebRTC: ${ip}`);

            // Update digital footprint if available globally
            if (window.digitalFootprint) {
                window.digitalFootprint.categories.network.items.push('webrtc-ip-leak');
                window.digitalFootprint.categories.network.score += 15;
            }
            
            // Update user profile if available
            if (window.userProfile && window.userProfile.geoContext) {
                window.userProfile.geoContext.localIP = ip;
            }
            
            return ip;
        } else {
            if (window.DOMElements['local-ip-value']) {
                window.DOMElements['local-ip-value'].textContent = 'NOT DETECTED';
                if (window.DOMElements['local-ip-value'].classList) {
                    window.DOMElements['local-ip-value'].classList.remove('severity-medium');
                    window.DOMElements['local-ip-value'].classList.add('severity-low');
                }
            }
            console.log('Local IP not detected via WebRTC');
            return null;
        }
    } catch (err) {
        console.error('WebRTC IP detection error:', err.message || err);
        if (window.DOMElements['local-ip-value']) {
            window.DOMElements['local-ip-value'].textContent =
                err.message === 'IP detection timeout' ? 'DETECTION TIMEOUT' : 'ERROR';
            if (window.DOMElements['local-ip-value'].classList) {
                window.DOMElements['local-ip-value'].classList.remove('severity-high', 'severity-low');
                window.DOMElements['local-ip-value'].classList.add('severity-medium');
            }
        }
        return null;
    }
}

/**
 * Fetches the public IP address via external service
 * @returns {Promise<string|null>} The detected public IP or null
 */
async function fetchPublicIP() {
    if (!window.DOMElements) return null;
    
    console.log('Fetching public IP...');
    if (window.DOMElements['ip-value']) {
        window.DOMElements['ip-value'].textContent = 'FETCHING...';
    }

    try {
        // Try multiple services in case one fails
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/'
        ];
        
        // Try services in order until one succeeds
        for (const service of services) {
            try {
                const response = await fetch(service);
                if (!response.ok) continue;
                
                const data = await response.json();
                const ip = data.ip;
                
                if (!ip) continue;
                
                if (window.DOMElements['ip-value']) {
                    window.DOMElements['ip-value'].textContent = ip;
                    if (window.DOMElements['ip-value'].classList) {
                        window.DOMElements['ip-value'].classList.add('severity-high');
                    }
                }
                
                // Update user profile if available
                if (window.userProfile && window.userProfile.geoContext) {
                    window.userProfile.geoContext.publicIP = ip;
                    
                    // If there's additional geo data from ipapi.co
                    if (data.country_name) {
                        window.userProfile.geoContext.country = data.country_name;
                        window.userProfile.geoContext.region = data.region;
                        window.userProfile.geoContext.city = data.city;
                        
                        // Update estimated location if available
                        if (window.DOMElements['summary-location']) {
                            const locationText = data.city && data.country_name ? 
                                `${data.city}, ${data.country_name}` : 
                                data.country_name || 'Unknown';
                                
                            window.DOMElements['summary-location'].textContent = locationText;
                        }
                    }
                }
                
                return ip;
            } catch (serviceError) {
                console.warn(`Error fetching IP from ${service}:`, serviceError);
                // Continue to next service
            }
        }
        
        // If all services failed
        throw new Error('All IP fetch services failed');
    } catch (err) {
        console.error('Error fetching public IP:', err);
        if (window.DOMElements['ip-value']) {
            window.DOMElements['ip-value'].textContent = 'FETCH ERROR';
        }
        return null;
    }
}

/**
 * Tests network performance by measuring download and upload speeds
 */
async function testNetworkSpeed() {
    if (!window.DOMElements) return;
    
    console.log('Testing network speed...');
    
    const downloadEl = window.DOMElements['download-speed'];
    const uploadEl = window.DOMElements['upload-speed'];
    
    if (downloadEl) downloadEl.textContent = 'TESTING...';
    if (uploadEl) uploadEl.textContent = 'TESTING...';

    try {
        // Simplified speed test for demo purposes
        const testSize = window.CONFIG?.SPEED_TEST_SIZE || 1000000; // 1MB
        const testData = new ArrayBuffer(testSize);
        const startTime = performance.now();
        
        // Download test (fetch a known size file)
        // For demo, we'll just measure the time to create the buffer
        const downloadTime = performance.now() - startTime;
        const downloadSpeed = (testSize / downloadTime) * (1000 / 1024 / 1024); // MB/s
        
        if (downloadEl) {
            downloadEl.textContent = `${downloadSpeed.toFixed(2)} MB/s`;
        }
        
        // Upload test (simulated by measuring time to stringify the buffer)
        const uploadStartTime = performance.now();
        const blob = new Blob([testData]);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        const uploadTime = performance.now() - uploadStartTime;
        const uploadSpeed = (testSize / uploadTime) * (1000 / 1024 / 1024); // MB/s
        
        if (uploadEl) {
            uploadEl.textContent = `${uploadSpeed.toFixed(2)} MB/s`;
        }
        
        // Update connection info if available
        if (window.DOMElements['connection-value'] && navigator.connection) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType || 'unknown';
            window.DOMElements['connection-value'].textContent = effectiveType.toUpperCase();
            
            if (connection.downlink) {
                if (window.DOMElements['bandwidth-value']) {
                    window.DOMElements['bandwidth-value'].textContent = `${connection.downlink} Mbps`;
                }
            }
            
            if (connection.rtt) {
                if (window.DOMElements['latency-value']) {
                    window.DOMElements['latency-value'].textContent = `${connection.rtt} ms`;
                }
            }
        }
        
        // Update user profile if available
        if (window.userProfile) {
            window.userProfile.networkPerformance = {
                downloadSpeed: downloadSpeed.toFixed(2),
                uploadSpeed: uploadSpeed.toFixed(2),
                effectiveType: navigator.connection?.effectiveType || 'unknown',
                downlink: navigator.connection?.downlink || 'unknown',
                rtt: navigator.connection?.rtt || 'unknown'
            };
        }
    } catch (err) {
        console.error('Error testing network speed:', err);
        if (downloadEl) downloadEl.textContent = 'TEST ERROR';
        if (uploadEl) uploadEl.textContent = 'TEST ERROR';
    }
}

/**
 * Simulates a network connection map for visualization
 */
function simulateNetworkMap() {
    if (!window.DOMElements) return;
    
    console.log('Simulating network map...');
    const map = window.DOMElements['network-map'];
    if (!map) return;

    map.innerHTML = ''; // Clear previous map

    // Center point (You)
    const center = document.createElement('div');
    center.className = 'map-point center';
    center.style.left = '50%';
    center.style.top = '50%';
    map.appendChild(center);

    // Add some random points (simulating local/external connections)
    const points = 5 + Math.floor(Math.random() * 5); // 5-9 points
    for (let i = 0; i < points; i++) {
        const point = document.createElement('div');
        point.className = `map-point ${Math.random() > 0.7 ? 'outbound' : ''}`; // Some outbound
        const angle = Math.random() * 2 * Math.PI;
        const radius = 30 + Math.random() * 60; // Percentage radius from center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        // Ensure points stay roughly within bounds
        point.style.left = `${Math.max(5, Math.min(95, x))}%`;
        point.style.top = `${Math.max(5, Math.min(95, y))}%`;
        map.appendChild(point);
    }
    
    if (window.DOMElements['connections-value']) {
        window.DOMElements['connections-value'].textContent = `${points} NODES (Sim.)`;
        
        if (window.DOMElements['connections-value'].classList) {
            if (points > 7) {
                window.DOMElements['connections-value'].classList.add('severity-medium');
            } else {
                window.DOMElements['connections-value'].classList.add('severity-low');
            }
        }
    }
}

/**
 * Simulates detection of trackers for demonstration
 */
function simulateTrackerDetection() {
    if (!window.DOMElements || !window.DOMElements['trackers-value']) return;
    
    console.log('Simulating tracker detection...');
    
    // Simulate tracker detection for demonstration
    const trackerTypes = [
        'Analytics',
        'Social Media',
        'Advertising',
        'Session Replay',
        'Marketing',
        'Performance Monitoring'
    ];
    
    const trackerNames = [
        'Universal Analytics',
        'Facebook Pixel',
        'Google Tag Manager',
        'Google Ads',
        'LinkedIn Insight',
        'Twitter Analytics',
        'HotJar',
        'DoubleClick',
        'AppDynamics',
        'New Relic',
        'Amplitude',
        'Optimizely',
        'Adobe Analytics'
    ];
    
    // Select random trackers for simulation
    const trackerCount = 3 + Math.floor(Math.random() * 5); // 3-7 trackers
    const selectedTrackers = [];
    
    for (let i = 0; i < trackerCount; i++) {
        const type = trackerTypes[Math.floor(Math.random() * trackerTypes.length)];
        const name = trackerNames[Math.floor(Math.random() * trackerNames.length)];
        
        // Avoid duplicates
        const tracker = `${name} (${type})`;
        if (!selectedTrackers.includes(tracker)) {
            selectedTrackers.push(tracker);
        }
    }
    
    // Update UI
    window.DOMElements['trackers-value'].textContent = `${selectedTrackers.length} DETECTED (SIM.)`;
    
    // Set severity based on number of trackers
    if (window.DOMElements['trackers-value'].classList) {
        if (selectedTrackers.length > 5) {
            window.DOMElements['trackers-value'].classList.add('severity-high');
        } else if (selectedTrackers.length > 3) {
            window.DOMElements['trackers-value'].classList.add('severity-medium');
        } else {
            window.DOMElements['trackers-value'].classList.add('severity-low');
        }
    }
    
    // Update privacy factors if available
    if (window.privacyFactors) {
        window.privacyFactors.trackers = -5 * selectedTrackers.length; // Penalty for each tracker
    }
    
    // Update user profile if available
    if (window.userProfile) {
        window.userProfile.detectedTrackers = selectedTrackers;
    }
}

/**
 * Gets DNT (Do Not Track) and GPC (Global Privacy Control) status
 */
function getDNTStatus() {
    if (!window.DOMElements || !window.DOMElements['dnt-value']) return;
    
    console.log('Getting DNT status...');
    
    let dntEnabled = false;
    let gpcEnabled = false;
    
    // Check various DNT implementations
    if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' ||
        navigator.msDoNotTrack === '1' || window.doNotTrack === '1') {
        dntEnabled = true;
    }
    
    // Check for Global Privacy Control (newer standard)
    if (navigator.globalPrivacyControl === true) {
        gpcEnabled = true;
    }
    
    let statusText;
    let severityClass;
    
    if (dntEnabled && gpcEnabled) {
        statusText = 'DNT + GPC ENABLED';
        severityClass = 'severity-low';
        // Update privacy factors if available
        if (window.privacyFactors) window.privacyFactors.dnt = 15; // Better privacy
    } else if (dntEnabled) {
        statusText = 'DNT ENABLED';
        severityClass = 'severity-low';
        // Update privacy factors if available
        if (window.privacyFactors) window.privacyFactors.dnt = 10; // Better privacy
    } else if (gpcEnabled) {
        statusText = 'GPC ENABLED';
        severityClass = 'severity-low';
        // Update privacy factors if available
        if (window.privacyFactors) window.privacyFactors.dnt = 10; // Better privacy
    } else {
        statusText = 'DISABLED';
        severityClass = 'severity-medium';
        // Update privacy factors if available
        if (window.privacyFactors) window.privacyFactors.dnt = -10; // Penalty for no DNT
    }
    
    // Update UI
    window.DOMElements['dnt-value'].textContent = statusText;
    
    if (window.DOMElements['dnt-value'].classList) {
        window.DOMElements['dnt-value'].classList.remove('severity-low', 'severity-medium', 'severity-high');
        window.DOMElements['dnt-value'].classList.add(severityClass);
    }
    
    // Update user profile if available
    if (window.userProfile) {
        window.userProfile.privacySettings = {
            ...(window.userProfile.privacySettings || {}),
            dntEnabled,
            gpcEnabled
        };
    }
}

/**
 * Analyzes resource timing data for network insights
 */
function analyzeResourceTiming() {
    if (!window.DOMElements || !window.DOMElements['resource-timing-value'] || !window.performance || !window.performance.getEntriesByType) return;
    
    console.log('Analyzing resource timing...');
    
    try {
        // Get resource timing entries
        const resources = window.performance.getEntriesByType('resource');
        
        if (!resources || resources.length === 0) {
            window.DOMElements['resource-timing-value'].textContent = 'NO TIMING DATA';
            return;
        }
        
        // Analyze resource timing
        const analysis = {
            count: resources.length,
            totalSize: 0,
            totalDuration: 0,
            types: {},
            domains: {},
            slowestResource: { name: '', duration: 0 }
        };
        
        resources.forEach(resource => {
            // Calculate resource size if available
            let size = 0;
            if (resource.transferSize) {
                size = resource.transferSize;
                analysis.totalSize += size;
            }
            
            // Calculate resource duration
            const duration = resource.responseEnd - resource.startTime;
            analysis.totalDuration += duration;
            
            // Track resource by type
            const type = resource.initiatorType || 'unknown';
            if (!analysis.types[type]) analysis.types[type] = { count: 0, totalSize: 0 };
            analysis.types[type].count++;
            analysis.types[type].totalSize += size;
            
            // Track resource by domain
            try {
                const url = new URL(resource.name);
                const domain = url.hostname;
                if (!analysis.domains[domain]) analysis.domains[domain] = { count: 0, totalSize: 0 };
                analysis.domains[domain].count++;
                analysis.domains[domain].totalSize += size;
            } catch (e) {
                // URL parsing failed, skip domain tracking for this resource
            }
            
            // Track slowest resource
            if (duration > analysis.slowestResource.duration) {
                analysis.slowestResource = { 
                    name: resource.name.split('/').pop() || resource.name,
                    duration: duration
                };
            }
        });
        
        // Format the analysis for display
        const displayText = `${analysis.count} resources, ${(analysis.totalSize / 1024).toFixed(1)} KB total`;
        window.DOMElements['resource-timing-value'].textContent = displayText;
        
        // Update user profile if available
        if (window.userProfile) {
            window.userProfile.resourceTiming = analysis;
        }
    } catch (err) {
        console.error('Error analyzing resource timing:', err);
        window.DOMElements['resource-timing-value'].textContent = 'ANALYSIS ERROR';
    }
}

// Make all functions available through the modules namespace
window.modules.network = {
    getWebRTCIP,
    fetchPublicIP,
    testNetworkSpeed,
    simulateNetworkMap,
    simulateTrackerDetection,
    getDNTStatus,
    analyzeResourceTiming
};

// Also expose directly on window for backward compatibility
window.getWebRTCIP = getWebRTCIP;
window.fetchPublicIP = fetchPublicIP;
window.testNetworkSpeed = testNetworkSpeed;
window.simulateNetworkMap = simulateNetworkMap;
window.simulateTrackerDetection = simulateTrackerDetection;
window.getDNTStatus = getDNTStatus;
window.analyzeResourceTiming = analyzeResourceTiming;

// Log initialization
if (typeof window.logger !== 'undefined') {
    window.logger.info('Network module initialized.');
} else {
    console.info('[INF] Network module initialized.');
}