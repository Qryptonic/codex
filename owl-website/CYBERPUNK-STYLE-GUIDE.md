# Cyberpunk Style Guide - Owl Advisory Group

This document provides an overview of the cyberpunk visual styling elements used throughout the Owl Advisory Group website.

## Color Palette

```css
:root {
    --bg-color: #000000;           /* Background color */
    --text-color: #FFFFFF;         /* Primary text color */
    --purple-primary: #8A2BE2;     /* Primary brand color */
    --purple-light: #A855F7;       /* Lighter purple accent */
    --purple-glow: rgba(168, 85, 247, 0.7); /* Glow effect color */
    --purple-dark: #4B0082;        /* Dark purple for shadows */
    --cyan-accent: #00FFFF;        /* Cyan accent for highlights */
    --red-accent: #FF0055;         /* Red accent for warnings */
    --border-color: rgba(168, 85, 247, 0.6); /* Border color */
    --panel-bg: rgba(10, 0, 20, 0.92); /* Panel background */
    --alert-red: #FF1744;          /* Alert state - high */
    --alert-yellow: #FFD700;       /* Alert state - medium */
    --alert-green: #00E676;        /* Alert state - low */
}
```

## Typography

- **Primary Font**: JetBrains Mono (monospace) - Perfect for the terminal aesthetic
- **Title Font**: Syncopate (sans-serif) - Used for headers and logo text

## Visual Elements

### Grid Background
- Subtle grid with purple lines
- Circuit-like decoration using linear and radial gradients
- Background pulse animation for subtle movement

### Data Corruption Effect
Applied to critical warnings and headers:
```css
.data-corruption::before {
    content: attr(data-text);
    position: absolute;
    left: 0;
    text-shadow: 1px 0 var(--cyan-accent);
    top: 0;
    color: var(--purple-light);
    background: var(--bg-color);
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    animation: data-corruption-anim-1 3s infinite linear alternate-reverse;
}
```

### Terminal Effect
For loading indicators and dynamic text:
```css
.data-value.terminal-active {
    position: relative;
    animation: textPulse 1.5s infinite alternate;
    color: var(--cyan-accent);
}
```

### Panel Styling
- Semi-transparent dark background
- Cyberpunk corner accents created with CSS pseudo-elements
- Subtle glow effect on hover
- Animated gradient headers

### Button Effects
- Gradient background with animated hover states
- Power button glow effect using ::before pseudo-element
- Scanning animation on hover using ::after pseudo-element

### Scanning Animations
Used for progress indicators and active elements:
```css
@keyframes scanAnimation {
    0% { top: 0; }
    100% { top: 100%; }
}
```

### Severity Indicators
- Low severity: Green color with subtle glow
- Medium severity: Yellow color with subtle glow
- High severity: Red color with animated glitch effect

## Animation Types

### Glitch Effect
```css
@keyframes glitchEffect {
    0% { text-shadow: 0.05em 0 0 rgba(255,0,0,0.75), -0.05em -0.025em 0 rgba(0,255,0,0.75), 0.025em 0.05em 0 rgba(0,0,255,0.75); }
    /* ... more keyframes ... */
}
```

### Container Glow
```css
@keyframes containerGlow { 
    0% { box-shadow: 0 0 45px rgba(168, 85, 247, 0.4), inset 0 0 15px rgba(168, 85, 247, 0.1); } 
    /* ... more keyframes ... */
}
```

### Circuit Slide
```css
@keyframes circuitSlide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
```

### Text Shine
```css
@keyframes textShine {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
}
```

## Implementation Tips

1. Use `data-text` attributes for elements that need the data corruption effect
2. Apply the `terminal-active` class to loading indicators
3. Use the `severity-high`, `severity-medium`, and `severity-low` classes for status indicators
4. Use the `.panel` class for containers, which provides the corner accents automatically
5. The `.glitch-text` class can be applied temporarily to any text element for emphasis

## Responsive Design

The cyberpunk styling automatically adapts to different screen sizes with these breakpoints:

- Large displays: 4-column grid (`@media (max-width: 1500px)`)
- Medium displays: 3-column grid (`@media (max-width: 1100px)`)
- Small displays: 2-column grid 
- Mobile: 1-column grid (`@media (max-width: 768px)`)
- Extra small: Compact styling (`@media (max-width: 380px)`)

## Example Usage

```html
<!-- Data corruption effect -->
<span class="data-value severity-high data-corruption" data-text="VULNERABILITY DETECTED">VULNERABILITY DETECTED</span>

<!-- Terminal effect for loading -->
<span class="data-value terminal-active">DETECTING...</span>

<!-- Panel with cyberpunk corners -->
<div class="panel">
    <div class="panel-header">System & Hardware</div>
    <div class="panel-content">
        <!-- Content here -->
    </div>
</div>
```

## Japanese Anime-Inspired Elements

Our cyberpunk aesthetic is heavily influenced by Japanese anime and cyberpunk media. Key visual elements include:

### Neon Color Effects
Draw inspiration from Neo-Tokyo night scenes with vibrant neons against dark backgrounds:

```css
.neon-text {
    color: var(--cyan-accent);
    text-shadow: 0 0 5px var(--cyan-glow), 0 0 10px var(--cyan-glow);
    animation: neon-pulse 3s infinite alternate;
}
```

### Holographic Elements
Create depth and futuristic feel with pseudo-holographic effects:

```css
.holographic-element {
    background: linear-gradient(135deg, 
        var(--purple-dark) 0%,
        var(--purple-primary) 50%, 
        var(--cyan-accent) 100%);
    background-size: 200% 200%;
    animation: holographic-shift 5s infinite linear;
}
```

### Data Visualization Styles
All data visualization elements should incorporate:

- Animated scan lines
- Pulsing glow effects around important data
- "Digital noise" on hover
- Asymmetric grid layouts inspired by futuristic interfaces

### Fingerprint Visualization
The fingerprint correlation visualization follows distinct cyberpunk styling:

```css
.correlation-table .fingerprint-hash.highlighted {
    color: var(--cyan-accent);
    text-shadow: 0 0 5px var(--cyan-glow);
    position: relative;
    overflow: hidden;
}

.correlation-table .fingerprint-hash.highlighted::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(22, 202, 220, 0.2) 50%, 
        transparent 100%);
    animation: highlight-scan 1.5s infinite ease-in-out;
}
```

## Entropy Visualization

The entropy calculation and visual presentation should follow a data-driven aesthetic:

```css
.entropy-bar {
    height: 20px;
    background: linear-gradient(90deg, var(--purple-light), var(--cyan-accent));
    margin-bottom: 5px;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 5px rgba(139, 48, 209, 0.4);
}

.entropy-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0) 10%,
        rgba(255, 255, 255, 0.1) 20%,
        rgba(255, 255, 255, 0) 30%,
        rgba(255, 255, 255, 0.1) 40%,
        rgba(255, 255, 255, 0) 50%,
        rgba(255, 255, 255, 0.1) 60%,
        rgba(255, 255, 255, 0) 70%,
        rgba(255, 255, 255, 0.1) 80%,
        rgba(255, 255, 255, 0) 90%,
        rgba(255, 255, 255, 0.1) 100%
    );
    animation: shimmer 2s infinite linear;
    mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, transparent 100%);
}
```

## Design Philosophy

Our Japanese-inspired Cyberpunk aesthetic adheres to these principles:

1. **High Tech, Low Life**: Contrast advanced technology against darker implications

2. **Digital Mysticism**: Blend technology with almost spiritual significance through glowing effects and animation

3. **Data Physicality**: Make abstract data feel tangible through visual effects

4. **Asymmetric Balance**: Create visual tension with intentionally asymmetric but balanced layouts

5. **Information Density**: Dense information presented with strong visual hierarchy

6. **Luminance Contrast**: Dark backgrounds with bright, vibrant highlights

7. **Retrofuturism**: Combine sleek modern design with retro-tech elements

## Asset Creation Guidelines

When creating new visual assets or UI elements:

1. Use predominantly dark backgrounds with vibrant accent colors
2. Implement at least one animated element per component
3. Maintain high contrast ratios for readability
4. Incorporate circuit or grid patterns as textural elements
5. Use asymmetrical layouts with strong grid alignment
6. Apply Japanese-inspired minimalism to prevent visual overload
7. Ensure all interactive elements have distinct hover/active states with animation

## Recommended References

For additional cyberpunk style inspiration, consult:

- Ghost in the Shell (anime) - UI design and holographic displays
- Blade Runner 2049 - Color palette and lighting
- Neuromancer (novel) - Conceptual framework
- Akira - Urban Japanese cyberpunk aesthetic
- Serial Experiments Lain - Digital glitch effects and UI anomalies