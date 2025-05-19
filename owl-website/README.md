# OWL ADVISORY GROUP - SECURITY SCANNER DEMO

![Owl Advisory Group](img/owl-icon-192.png)

## Project Overview

The Owl Advisory Group Security Scanner is a cyberpunk-themed demonstration website that showcases extensive data collection capabilities in modern web browsers. This project serves as both a visual demonstration of cyberpunk aesthetics and an educational tool about privacy concerns in today's digital landscape.

> ⚠️ **EDUCATIONAL PURPOSE ONLY**: This project demonstrates what data websites can collect with user consent. It's designed to raise awareness about digital privacy.

## Key Features

### 1. Advanced Data Collection & Device Interaction
- Browser fingerprinting (canvas, audio, WebGL)
- Real-time hardware detection
- Camera and microphone access with live visualization
- Geolocation tracking with precision metrics
- Device sensor access (motion, orientation, light)
- WebRTC for local IP detection
- Battery status monitoring
- Clipboard access
- Keyboard dynamics tracking

### 2. Cyberpunk Visual Aesthetics
- Immersive terminal-inspired interface
- Animated scan lines and particle effects
- 3D transformations with perspective
- Dynamic data visualization with real-time updates
- Glitch effects and animated UI elements
- Holographic display elements
- Responsive design for all devices

### 3. Interactive Risk Assessment
- Real-time privacy risk calculation
- Identity leakage assessments
- Network security visualization
- Permission analysis

### 4. Executive Summary Dashboard
- Comprehensive data overview
- Visual representation of collected information
- Color-coded risk indicators
- Animated network topology map

## Technical Implementation

### Frontend 
- Pure HTML5, CSS3, and Vanilla JavaScript
- No frameworks or libraries (intentionally minimalist)
- CSS Grid for responsive dashboard layout
- Canvas API for visualizations
- Modern Browser APIs integration

### Core Functionality
- Service Worker for offline capabilities
- PWA-compatible with manifest
- Browser API integration for hardware access
- Dynamically loaded modules for feature detection
- Event-driven architecture for UI updates

## Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/owl-website.git

# Navigate to project directory
cd owl-website

# Start a local server
python -m http.server 9001
```

Then visit http://localhost:9001/minimal.html in your browser.

### Deployment

The site can be deployed to any static hosting service such as:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Firebase Hosting

Simply upload the entire directory contents to your hosting provider.

## Project Structure

```
owl-website/
├── css/
│   └── style.css                 # Main CSS styles
├── img/
│   ├── owl-icon-192.png          # PWA icon (small)
│   └── owl-icon-512.png          # PWA icon (large)
├── js/
│   ├── config.js                 # Configuration settings
│   ├── data-collection.js        # Data collection logic
│   ├── event-listeners.js        # UI event handlers
│   ├── main.js                   # Main application logic
│   ├── modules/                  # Feature-specific modules
│   │   └── hardware-analysis.js  # Hardware detection
│   └── sw.js                     # Service Worker
├── index.html                    # Main entry point
├── minimal.html                  # Enhanced cyberpunk interface
├── manifest.json                 # PWA manifest
└── README.md                     # This documentation
```

## Device Support

The application is designed to work on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS and Android)
- Tablets

*Note: Some features may require specific browser permissions and are dependent on the user's device capabilities.*

## Acknowledgments

- This project was inspired by cyberpunk themes in media like Blade Runner, Ghost in the Shell, and the Cyberpunk genre
- Icons and visual elements draw inspiration from 80s/90s cyberpunk aesthetics
- The data collection techniques are based on modern browser capabilities and privacy research

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2023 Owl Advisory Group - Security Scanner Demo | *For educational purposes only*