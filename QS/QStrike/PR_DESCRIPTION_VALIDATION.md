# Validation Utility Consolidation

## Problem

The codebase had multiple copies of the same `validate.js` file with different implementation details:

1. Some versions were simple and only did basic size/line checks
2. Others included streaming for large files and CSV format detection
3. They were scattered across different directories with identical names
4. The code was using CommonJS instead of TypeScript, breaking type safety

This led to several issues:
- Non-deterministic behavior based on which file was loaded first
- Mixed feature sets and inconsistent validation across components
- Difficulty maintaining duplicate code
- No proper TypeScript types or IDE autocompletion

## Solution

1. Created a canonical TypeScript implementation in `src/utils/validation/validate.ts` that:
   - Uses streaming for efficient processing of large files
   - Handles both JSON arrays and NDJSON formats
   - Performs CSV detection to reject non-JSON files early
   - Includes configurable schema validation
   - Uses proper error codes for consistent error handling

2. Added a barrel export through `src/utils/validation/index.ts` for clean imports:
   ```typescript
   import { validateFile } from '@/utils/validation';
   ```

3. Defined proper TypeScript interfaces:
   ```typescript
   export interface ValidationOptions {
     maxBytes?: number;
     maxLines?: number;
     sampleBytes?: number;
     validateSchema?: boolean;
   }

   export interface ValidationResult {
     valid: boolean;
     format: 'json' | 'ndjson' | 'unknown';
     eventCount?: number;
     error?: string;
     errorCode?: ErrorCode;
   }
   ```

4. Added comprehensive unit tests in `src/utils/__tests__/validation.test.ts` covering:
   - Empty file validation
   - CSV detection and rejection
   - JSON array validation
   - NDJSON validation
   - Corrupted file handling
   - Size limit enforcement
   - Schema validation

5. Removed duplicate files and updated imports to use the consolidated version

## Impact

- **Reliability**: One canonical implementation ensures consistent validation behavior
- **Type Safety**: TypeScript interfaces provide autocomplete and compile-time checks
- **Maintainability**: Single source of truth for all validation logic
- **Performance**: Streaming implementation efficiently handles large files
- **Quality**: Comprehensive test coverage ensures correctness

## Testing Done

- Added unit tests for all validation scenarios
- Verified successful validation of valid files
- Verified rejection of invalid files with appropriate error codes
- Tested CSV detection to prevent incorrect file format processing
- Manually verified upload service still works with the new implementation

## Follow-up Tasks

1. Add ESLint rule to prevent creating new JavaScript files in the root directories
2. Add CI check to verify no duplicate utility files exist