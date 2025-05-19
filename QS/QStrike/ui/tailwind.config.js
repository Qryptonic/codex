/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all relevant files in src
  ],
  theme: {
    extend: {
      // Define colors using CSS variables defined in theme.css
      colors: {
        // Base theme colors
        'accent-pink': 'var(--accent-pink)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-violet': 'var(--accent-violet)',
        'bg-0': 'var(--bg-0)',
        'bg-1': 'var(--bg-1)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
        
        // Cyber-Ops Grade colors
        'threat-red': 'var(--threat-red)',
        'threat-orange': 'var(--threat-orange)',
        'threat-yellow': 'var(--threat-yellow)',
        'threat-green': 'var(--threat-green)',
        'secure-blue': 'var(--secure-blue)',
        'packet-trace': 'var(--packet-trace)',
        'cmd-glass': 'var(--cmd-glass)',
        'zero-day': 'var(--zero-day)',
        'breach': 'var(--breach-indicator)',
        
        // Color-blind safe palette
        'cb-red': 'var(--cb-red)',
        'cb-blue': 'var(--cb-blue)',
        'cb-green': 'var(--cb-green)',
        'cb-orange': 'var(--cb-orange)',
        'cb-purple': 'var(--cb-purple)',
        'cb-yellow': 'var(--cb-yellow)',
      },
      // Define custom font families
      fontFamily: {
        // Match names used in theme.css or component classes
        sans: ['Eurostile Extended', 'IBM Plex Sans', 'system-ui', 'sans-serif'], 
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        // Keep separate names if needed for specific elements
        eurostile: ['Eurostile Extended', 'Roboto', 'sans-serif'], 
        plex: ['IBM Plex Sans', 'sans-serif'],
        'plex-mono': ['IBM Plex Mono', 'monospace'],
      },
      // Define custom box shadows for neon effects
      boxShadow: {
        'neon-pink': '0 0 5px var(--accent-pink), 0 0 15px var(--accent-pink)', // Adjusted spread
        'neon-cyan': '0 0 5px var(--accent-cyan), 0 0 15px var(--accent-cyan)',
        'neon-violet': '0 0 5px var(--accent-violet), 0 0 15px var(--accent-violet)',
        'threat-red': '0 0 5px var(--threat-red), 0 0 15px var(--threat-red)',
        'threat-green': '0 0 5px var(--threat-green), 0 0 15px var(--threat-green)',
        'packet-trace': '0 0 5px var(--packet-trace), 0 0 10px var(--packet-trace)',
        'cmd-glass': '0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 246, 255, 0.1) inset, 0 0 20px rgba(0, 246, 255, 0.05) inset',
      },
      // Define custom animations (optional, can also use keyframes in CSS)
      keyframes: {
         pulse: {
           '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
           '50%': { opacity: '1', transform: 'scale(1.05)' },
         },
         ticker: {
           '0%': { transform: 'translateX(100%)' },
           '100%': { transform: 'translateX(-100%)' },
         },
         'pulse-threat': {
           '0%': { boxShadow: '0 0 5px 0 rgba(255, 59, 48, 0.5)' },
           '50%': { boxShadow: '0 0 15px 0 rgba(255, 59, 48, 0.8)' },
           '100%': { boxShadow: '0 0 5px 0 rgba(255, 59, 48, 0.5)' },
         },
         'packet-pulse': {
           '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
           '50%': { opacity: '1', transform: 'scale(1.2)' },
         },
         'laser-scan': {
           '0%': { opacity: '0', transform: 'translateY(-100%)' },
           '10%': { opacity: '0.8' },
           '90%': { opacity: '0.8' },
           '100%': { opacity: '0', transform: 'translateY(100%)' },
         }
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ticker: 'ticker 25s linear infinite',
        'pulse-threat': 'pulse-threat 1s infinite',
        'packet-pulse': 'packet-pulse 1.5s infinite',
        'laser-scan': 'laser-scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
} 