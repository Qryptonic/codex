# QStrike UI

Quantum-aware dashboard for the QStrike quantum computing platform.

## CSS Theming System

This project uses a centralized CSS variable system for consistent theming across components.

### CSS Variable Structure

All CSS variables are defined in `/src/css/theme-variables.css`. This ensures:

1. All color and style definitions are in one location 
2. Components reference the same variables
3. Theme switching becomes easier to implement
4. Fallback values are provided for browser compatibility

### Key CSS Variable Categories

- **Color Palette**: Core colors with systematic naming
- **Background Colors**: Various background shades
- **Accent Colors**: Primary, secondary, and tertiary accent colors
- **Provider Colors**: Colors for different quantum providers
- **Component-Specific Variables**: Panel styling, visualization colors
- **Animation Durations**: Consistent animation timing 
- **Accessibility Overrides**: High contrast mode support

### CSS Validation

The project includes a CSS variable validation script that ensures all variables used in the codebase are properly defined:

```bash
# Run the CSS variable validation
npm run validate:css
```

This script:
- Scans all JS/TS/CSS files for CSS variable usage
- Extracts variable definitions from theme-variables.css
- Reports any variables used but not defined
- Identifies unused variables

### Adding New Variables

When adding new UI elements that need CSS variables:

1. Add the variable definition to `/src/css/theme-variables.css`
2. Include a fallback value in the format: `var(--variable-name, #fallback)`
3. Run `npm run validate:css` to verify all variables are properly defined

### Tailwind CSS Integration

For Tailwind CSS users, there are compatibility classes defined at the bottom of the theme-variables.css file:

```css
.text-text-primary { color: var(--text-primary, #E0E0E0); }
.text-accent-primary { color: var(--accent-primary, #00F6FF); }
```

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd QStrike

# Option 1: Local Development (No Docker)
cd ui
cp .env.development.example .env.development
npm ci
npm run dev

# Option 2: Docker Development
docker compose -f docker-compose.dev.yml up -d
```

The application will be available at:
- **Local:** http://localhost:5173
- **Health Check:** http://localhost:5173/__health

## Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test
npm run test:ui  # UI component tests

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
npm run preview  # Preview the build
```

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions
  - `workers/` - Web Workers for CPU-intensive tasks
- `public/` - Static assets
- `tests/` - Test files

## Debugging

Check `.env.development.example` for all required environment variables.

For additional documentation, see the [Developer Guide](/docs/DEV_GUIDE.md).

## Health Check Endpoint

Access the health check endpoint at:

```
http://localhost:5173/__health
```

This endpoint returns `OK` if the UI is functioning correctly.

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run UI smoke tests
npm run test:ui

# Run accessibility tests
npm run test:axe
```

## Troubleshooting

### Port already in use

If port 5173 is already in use, you can specify a different port:

```bash
npm run dev -- --port 3000
```

### Missing Buffer Polyfill

If you encounter errors related to Buffer not being defined, ensure that:

1. The `vite-plugin-node-polyfills` plugin is properly configured in `vite.config.ts`
2. The import is at the top of files that use it: `import { Buffer } from 'buffer';`

### Path Alias Issues

Path aliases (like `@/components`) are configured in both:
- `tsconfig.json` (for TypeScript)
- `vite.config.ts` (for Vite)

If imports using these aliases fail, check both configurations.
