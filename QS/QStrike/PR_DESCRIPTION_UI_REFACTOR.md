# UI Refactoring Plan

## Problem

The UI codebase has several structural issues that need to be addressed:

1. Multiple competing `App.tsx`/`app.tsx` files causing bundle conflicts
2. Google Lighthouse viewer accidentally bundled with our quantum dashboard
3. Inconsistent development server port configurations
4. Case-sensitivity issues that could break the build on Linux/CI
5. Unnecessarily duplicated code

## Solution

### 1. Restructure the Repo

Create a monorepo structure with separate packages:

```
/packages
  /dashboard-ui     - Our React/Tailwind quantum dashboard
  /lhr-viewer       - The Preact Lighthouse viewer (isolated)
```

Each package will have its own:
- `package.json` with specific dependencies
- `vite.config.ts` with appropriate plugins
- `tsconfig.json` with strict settings

### 2. Remove Duplicate Files

- Delete `src/app.tsx` stub
- Keep only the relevant entry points in each package
- Consolidate duplicate component implementations

### 3. Standardize Development Experience

- Set dashboard to consistently run on port 3000
- Add cross-env for consistent configuration across platforms
- Update scripts in `run-dev.sh` to use the new structure

### 4. Enforce Code Quality

- Add case-sensitivity checks in Vite and TypeScript
- Configure ESLint with `no-duplicate-imports` rule
- Add pre-commit checks using a tidy script to prevent duplicates

## Impact

- **Performance**: Smaller bundle size by removing unrelated code
- **Reliability**: Single unambiguous entry point for each app
- **Maintainability**: Clear separation of concerns between apps
- **Developer Experience**: Consistent port configuration and better tooling

## Implementation Steps

1. Create the new directory structure
2. Move relevant files to their proper locations
3. Update build configurations
4. Add quality enforcement tools
5. Document the new workflow in README.md
6. Update CI pipeline to handle the monorepo structure

## Testing Done

- Verify both apps build independently
- Confirm dashboard always starts on port 3000
- Test case-sensitivity enforcement
- Validate no file duplication with jscpd

## Migration Guide

For developers:

```bash
# Run the dashboard UI
pnpm --filter dashboard-ui dev  # http://localhost:3000

# Run the Lighthouse viewer (if needed)
pnpm --filter lhr-viewer preview  # http://localhost:5173
```