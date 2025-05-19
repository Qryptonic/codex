# Dashboard UI Improvement Plan

This document outlines a comprehensive plan to improve the dashboard UI based on the audit report. The plan is divided into immediate actions (high priority) and next steps (medium priority).

## 1. Immediate Actions (High Priority)

### 1.1. Path Alias Consistency

The dashboard UI has inconsistent path alias usage. While `@/` is configured in both `tsconfig.json` and `vite.config.ts`, some imports use relative paths instead. This inconsistency can lead to runtime errors.

**Action Items:**
- [ ] **Standardize all imports to use relative paths** instead of the `@/` alias
- [ ] Update vite.config.ts to remove the path alias if not needed
- [ ] Ensure all imports consistently follow the same pattern

### 1.2. Clean Up Legacy Files

The codebase contains 32 JavaScript files alongside TypeScript versions of the same files. This duplication can cause confusion and maintenance issues.

**Action Items:**
- [ ] Remove all JavaScript (.js) duplicates of TypeScript (.tsx/.ts) files
- [ ] Update the .gitignore to prevent accidental commits of build artifacts
- [ ] Update imports to consistently reference TypeScript files

**Files to Remove:**
```
src/App.js
src/components/*.js (22 files)
src/hooks/useEvents.js
src/store.js
src/utils/*.js (5 files)
src/workers/decoder.worker.js
```

### 1.3. Test Improvements

The test suite has several issues, including Web Worker mocking problems and inconsistent configurations between Jest and Vitest.

**Action Items:**
- [ ] Create proper Web Worker mocks for testing
- [ ] Standardize on a single test runner (Vitest or Jest, not both)
- [ ] Fix failing tests or mark them as skipped with clear TODOs
- [ ] Ensure test files consistently use TypeScript

### 1.4. Dependency Updates

Several dependencies are outdated, which could lead to security issues or incompatibilities.

**Action Items:**
- [ ] Update non-breaking dependencies 
- [ ] Plan for major version upgrades (React 19, TypeScript ESLint 8, etc.)
- [ ] Document dependency decisions in README.md

## 2. Next Steps (Medium Priority)

### 2.1. Performance Optimizations

The build output shows multiple large chunks (>500KB), which can impact load time.

**Action Items:**
- [ ] Improve code splitting with dynamic imports
- [ ] Optimize Three.js and D3 visualizations
- [ ] Consider lazy loading more components

### 2.2. Testing Coverage

While there are some smoke tests, the overall test coverage is unclear.

**Action Items:**
- [ ] Add component tests for major dashboard features
- [ ] Implement visual regression testing for key visualizations
- [ ] Set up GitHub Actions for test automation

### 2.3. Accessibility Improvements

The dashboard needs better accessibility support.

**Action Items:**
- [ ] Implement full keyboard navigation
- [ ] Enhance color contrast for visualizations
- [ ] Add ARIA labels to interactive elements
- [ ] Test with screen readers

### 2.4. Documentation Updates

**Action Items:**
- [ ] Update README with development setup instructions
- [ ] Add component documentation for major features
- [ ] Document WebSocket data format and expectations
- [ ] Create a data flow diagram

## 3. Implementation Schedule

### Week 1: High Priority Items
- Clean up legacy files
- Standardize import paths
- Fix critical test issues

### Week 2: Medium Priority Items
- Performance optimizations
- Accessibility improvements
- Documentation updates

## 4. Technical Debt Tracking

Create tickets for each of the above items in the project tracking system to ensure these improvements are prioritized alongside feature development.

---

By addressing these items systematically, we can significantly improve the maintainability, reliability, and performance of the dashboard UI.