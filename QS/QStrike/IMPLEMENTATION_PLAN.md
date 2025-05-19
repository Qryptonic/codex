# UI Implementation Plan

## 1. Create Monorepo Structure

```bash
# Create packages directory
mkdir -p packages/dashboard-ui packages/lhr-viewer

# Copy base configs to root for sharing
cp ui/.prettierrc .
cp ui/.eslintrc.js .
```

## 2. Dashboard UI Package Setup

```bash
# Move current UI files to dashboard-ui
mkdir -p packages/dashboard-ui/src packages/dashboard-ui/public

# Copy core files
cp -r ui/src/components packages/dashboard-ui/src/
cp -r ui/src/hooks packages/dashboard-ui/src/
cp -r ui/src/utils packages/dashboard-ui/src/
cp -r ui/src/workers packages/dashboard-ui/src/
cp ui/src/App.tsx packages/dashboard-ui/src/
cp ui/src/main.tsx packages/dashboard-ui/src/
cp ui/src/store.ts packages/dashboard-ui/src/
cp ui/src/theme.css packages/dashboard-ui/src/
cp ui/src/QuantumEvent.avsc packages/dashboard-ui/src/

# Copy public assets
cp -r ui/public packages/dashboard-ui/

# Create package.json with port 3000 config
cat > packages/dashboard-ui/package.json << EOF
{
  "name": "dashboard-ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "cross-env PORT=3000 vite",
    "build": "tsc --noEmitOnError false && vite build",
    "preview": "cross-env PORT=3000 vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css}\"",
    "test": "vitest",
    "test:ci": "vitest run --coverage"
  },
  "dependencies": {
    "avsc": "^5.7.7",
    "d3": "^7.9.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "framer-motion": "^12.8.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1", 
    "react-error-boundary": "^4.0.13",
    "three": "^0.176.0",
    "zustand": "^4.5.2"
  }
}
EOF

# Create vite.config.ts with case-sensitivity enforcement
cat > packages/dashboard-ui/vite.config.ts << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import checker from 'vite-plugin-checker';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
    checker({ typescript: true }),
    {
      name: 'enforce-case-sensitive-paths',
      handleHotUpdate({ file, server }) {
        if (file !== file.toLowerCase()) {
          server.ws.send({
            type: 'error',
            err: { message: \`Path \${file} is not lower-case → may break on Linux CI\` },
          });
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
EOF

# Create tsconfig.json with case sensitivity enforcement
cat > packages/dashboard-ui/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create tsconfig.node.json
cat > packages/dashboard-ui/tsconfig.node.json << EOF
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
```

## 3. Lighthouse Viewer Package Setup

```bash
# Create minimal package for the Lighthouse viewer
mkdir -p packages/lhr-viewer/src

# Create package.json
cat > packages/lhr-viewer/package.json << EOF
{
  "name": "lhr-viewer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "preact": "^10.19.6"
  }
}
EOF

# Create vite.config.ts
cat > packages/lhr-viewer/vite.config.ts << EOF
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
});
EOF

# Create tsconfig.json
cat > packages/lhr-viewer/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
EOF
```

## 4. Root Package Setup

```bash
# Create root package.json for workspace management
cat > package.json << EOF
{
  "name": "qstrike",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --filter dashboard-ui dev",
    "build": "pnpm --filter dashboard-ui build",
    "lhr": "pnpm --filter lhr-viewer preview",
    "lint": "pnpm run --filter dashboard-ui lint",
    "test": "pnpm run --filter dashboard-ui test",
    "tidy": "bash scripts/tidy.sh"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^10.1.2",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^4.6.2",
    "jscpd": "^3.5.10",
    "prettier": "^3.5.3"
  }
}
EOF
```

## 5. Add Code Quality Tools

```bash
# Create ESLint rule for duplicate files
mkdir -p eslint-plugins

cat > eslint-plugins/no-duplicate-files.js << EOF
/**
 * @fileoverview Rule to detect duplicate files in the codebase
 */
"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prevent duplicate files across the codebase",
      category: "Best Practices",
      recommended: true
    },
    schema: []
  },

  create: function(context) {
    return {
      Program: function(node) {
        const filename = context.getFilename();
        
        // Skip for non-js/ts files or node_modules
        if (!(/\.(js|ts|jsx|tsx)$/.test(filename)) || filename.includes('node_modules')) {
          return;
        }
        
        // Check for validate.js duplications
        if (filename.includes('validate.js') || filename.includes('validate.ts')) {
          context.report({
            node,
            message: "Potential duplicate file detected. Use canonical implementation in src/utils/validation/"
          });
        }
      }
    };
  }
};
EOF

cat > eslint-plugins/index.js << EOF
module.exports = {
  rules: {
    "no-duplicate-files": require("./no-duplicate-files")
  }
};
EOF

# Create pre-commit tidy script
mkdir -p scripts

cat > scripts/tidy.sh << EOF
#!/usr/bin/env bash
# scripts/tidy.sh

echo "Running code tidying..."

# Format code
echo "Formatting code with Prettier..."
npx prettier -w "packages/**/*.{ts,tsx,js,jsx,json,css}"

# Fix auto-fixable ESLint issues
echo "Running ESLint fixes..."
npx eslint --fix "packages/**/*.{ts,tsx,js,jsx}"

# Check for code duplication
echo "Checking for code duplication..."
npx jscpd --min-tokens 30 packages/
if [ $? -ne 0 ]; then
  echo "Code duplication detected. Please refactor to reduce duplication."
  exit 1
fi

# Check for lowercase files 
echo "Checking for case-sensitivity issues..."
find packages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  basename=$(basename "$file")
  lowercase=$(echo "$basename" | tr '[:upper:]' '[:lower:]')
  
  if [ "$basename" != "$lowercase" ]; then
    echo "Warning: File '$file' does not use lowercase naming. This could cause issues on Linux/CI."
    exit 1
  fi
done

echo "All checks passed!"
EOF

chmod +x scripts/tidy.sh

# Update run-dev.sh script
cat > run-dev.sh << EOF
#!/bin/bash

# QStrike Development Runner
# Starts the dashboard UI on port 3000

PORT=3000

# Print help if requested
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "QStrike Development Server"
  echo "Usage: ./run-dev.sh [options]"
  echo ""
  echo "Options:"
  echo "  --help, -h     Show this help message"
  echo "  --port PORT    Set custom port (default: 3000)"
  echo ""
  exit 0
fi

# Process arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Ensure we clean up processes on exit
function cleanup() {
  echo "Shutting down development servers..."
  kill $(jobs -p) 2>/dev/null
  exit 0
}

# Set up trap for clean shutdown
trap cleanup SIGINT SIGTERM

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the dashboard UI
echo "Starting Dashboard UI on port $PORT..."
cd packages/dashboard-ui && PORT=$PORT npm run dev

EOF

chmod +x run-dev.sh
```

## 6. Update Documentation

```bash
# Update README.md
cat > README.md << EOF
# QStrike: Quantum Computing Dashboard

## Project Structure

This project is organized as a monorepo with the following packages:

- \`packages/dashboard-ui\`: The main quantum operations dashboard (React + Tailwind)
- \`packages/lhr-viewer\`: Isolated Lighthouse report viewer (Preact)

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+ (recommended)

### Setup

\`\`\`bash
# Install dependencies
pnpm install
\`\`\`

### Running the Dashboard UI

\`\`\`bash
# Start the dashboard (runs on port 3000)
pnpm dev

# Or use the convenience script
./run-dev.sh
\`\`\`

### Building for Production

\`\`\`bash
# Build the dashboard UI
pnpm build
\`\`\`

### Running the Lighthouse Viewer (if needed)

\`\`\`bash
# Start the Lighthouse Report Viewer
pnpm lhr
\`\`\`

### Code Quality

\`\`\`bash
# Run linting
pnpm lint

# Run tests
pnpm test

# Run all code quality checks
pnpm tidy
\`\`\`

## Contributing

Please see CONTRIBUTING.md for guidelines.
EOF
```

## 7. Migration Implementation Steps

1. Create the directory structure as outlined above
2. Move relevant files to their new locations
3. Update import paths in the moved files
4. Test each package individually
5. Update CI workflows to use the new structure
6. Run jscpd to verify no code duplication