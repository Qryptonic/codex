/**
 * Test script to ensure screen transitions work correctly
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Testing screen transitions...');
    
    // Add click handlers to buttons
    const startScanButton = document.getElementById('start-scan-button');
    const continueButton = document.getElementById('continue-button');
    
    // Enable the continue button (remove disabled class)
    if (continueButton) {
        continueButton.classList.remove('disabled');
    }
    
    if (startScanButton) {
        startScanButton.addEventListener('click', function() {
            console.log('Start scan button clicked');
            const landingScreen = document.getElementById('landing-screen');
            const assessmentScreen = document.getElementById('assessment-screen');
            
            if (landingScreen && assessmentScreen) {
                console.log('Transitioning from landing to assessment');
                landingScreen.classList.remove('active');
                landingScreen.classList.add('hidden');
                
                assessmentScreen.classList.remove('hidden');
                assessmentScreen.classList.add('active');
                
                // Show progress animation
                const progressBar = document.getElementById('assessment-progress-bar');
                let progress = 0;
                const interval = setInterval(function() {
                    progress += 1;
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                }, 50);
            } else {
                console.error('Required screen elements not found');
            }
        });
    }
    
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            console.log('Continue button clicked');
            const assessmentScreen = document.getElementById('assessment-screen');
            const dashboardScreen = document.getElementById('dashboard-screen');
            
            if (assessmentScreen && dashboardScreen) {
                console.log('Transitioning from assessment to dashboard');
                assessmentScreen.classList.remove('active');
                assessmentScreen.classList.add('hidden');
                
                dashboardScreen.classList.remove('hidden');
                dashboardScreen.classList.add('active');
                
                // Start data collection
                console.log('Starting data collection');
                window.appState = window.appState || {};
                window.appState.dataCollectionActive = true;
                
                // Update some dashboard values to show it's working
                if (document.getElementById('username-value')) {
                    document.getElementById('username-value').textContent = 'Test User';
                }
                
                if (document.getElementById('session-id-value')) {
                    document.getElementById('session-id-value').textContent = Date.now().toString(16);
                }
                
                if (document.getElementById('local-time-value')) {
                    document.getElementById('local-time-value').textContent = new Date().toLocaleTimeString();
                }
            }
        });
    }
    
    console.log('Test handlers added successfully');
});