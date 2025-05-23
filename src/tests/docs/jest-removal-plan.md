# Jest Removal Plan

This document outlines the plan for removing Jest configuration once all tests have been migrated to Vitest.

## Files to Remove

1. **Jest Configuration Files**
   - `jest.config.js`
   - `jest.setup.js`
   - Any other Jest-specific setup files

2. **Jest-specific Test Files**
   - All files with `.test.js`, `.test.jsx`, `.test.ts`, or `.test.tsx` extensions that have been migrated to Vitest
   - Any Jest-specific test utilities that have been replaced by Vitest equivalents

## Dependencies to Remove

1. **Jest Core Dependencies**
   - `jest`
   - `ts-jest`
   - `babel-jest`
   - `jest-environment-jsdom`

2. **Jest-specific Testing Libraries**
   - `@testing-library/jest-dom` (unless it's being used with Vitest)

## Package.json Updates

1. **Remove Jest Scripts**
   - `test:jest`
   - `test:jest:coverage`
   - `test:jest:watch`
   - `test:all` (replace with just `test`)
   - `test:all:coverage` (replace with just `test:coverage`)

2. **Update ESLint Configuration**
   - Remove Jest-specific ESLint configuration from `eslintConfig` section

## Migration Verification

Before removing Jest configuration, ensure:

1. **All Tests Are Migrated**
   - Run `npm run test:jest` to verify that all tests have been migrated
   - If any tests are still using Jest, migrate them to Vitest

2. **All Tests Pass**
   - Run `npm run test` to verify that all Vitest tests pass
   - Fix any failing tests before proceeding

3. **Coverage Is Maintained**
   - Compare coverage reports from Jest and Vitest
   - Ensure that test coverage is maintained or improved

## Implementation Steps

1. **Identify Remaining Jest Tests**
   ```bash
   find src -name "*.test.*" | grep -v "vitest" | sort
   ```

2. **Migrate Remaining Tests**
   - Follow the patterns in `src/tests/docs/jest-to-vitest-migration.md`
   - Update test files to use Vitest
   - Verify that tests pass

3. **Update CI Configuration**
   - Remove Jest-specific CI steps
   - Ensure that Vitest tests are run in CI

4. **Remove Jest Configuration**
   - Remove Jest configuration files
   - Update package.json to remove Jest scripts and dependencies
   - Run `npm prune` to remove unused dependencies

5. **Final Verification**
   - Run `npm run test` to verify that all tests pass
   - Run `npm run test:coverage` to verify coverage
   - Run `npm run build` to verify that the build process works

## Timeline

1. **Phase 1: Migration (Current)**
   - Migrate tests from Jest to Vitest
   - Maintain both Jest and Vitest configurations
   - Update CI to run both Jest and Vitest tests

2. **Phase 2: Transition**
   - Make Vitest the primary testing framework
   - Keep Jest as a fallback for any tests that haven't been migrated
   - Update documentation to reflect the transition

3. **Phase 3: Removal**
   - Remove Jest configuration and dependencies
   - Update all documentation to reference Vitest only
   - Update CI to run only Vitest tests

## Potential Issues

1. **Test Coverage Gaps**
   - Some tests might behave differently in Vitest than in Jest
   - Ensure that all edge cases are covered

2. **CI Integration**
   - Ensure that CI pipelines are updated to use Vitest
   - Verify that test results are properly reported

3. **Developer Workflow**
   - Update documentation for developers
   - Provide training if necessary

## Conclusion

Removing Jest configuration is the final step in the migration process. By following this plan, we can ensure a smooth transition from Jest to Vitest while maintaining test coverage and developer productivity.
