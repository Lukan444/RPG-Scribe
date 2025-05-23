# Jest to Vitest Migration

This PR implements the migration from Jest to Vitest as our primary testing framework. Vitest offers better compatibility with Mantine UI components, faster execution, and improved TypeScript integration.

## Changes

1. **Migrated Tests**
   - Created Vitest versions of key tests:
     - `FirestoreService.vitest.ts`: Core service test with Firebase mocks
     - `EntityCard.vitest.tsx`: Complex UI component test with context and routing
     - `CharacterAPIService.vitest.ts`: API service test with axios mocks
     - `MantineTest.vitest.tsx`: Comprehensive test for Mantine UI components

2. **Updated Package Scripts**
   - Made Vitest the primary testing framework
   - Renamed scripts for clarity and consistency
   - Added scripts to run both Jest and Vitest tests during the transition period

3. **Updated CI Configuration**
   - Updated GitHub Actions workflow to run Vitest tests first
   - Maintained Jest tests during the transition period
   - Added combined coverage reporting

4. **Documentation**
   - Created a comprehensive Jest to Vitest migration guide at `src/tests/docs/jest-to-vitest-migration.md`
   - Created a plan for removing Jest configuration at `src/tests/docs/jest-removal-plan.md`

## Migration Guide

The migration guide at `src/tests/docs/jest-to-vitest-migration.md` provides detailed instructions for migrating tests from Jest to Vitest, including:

- Import statements
- Mocking functions and modules
- Mocking React Router
- Mocking components
- Rendering components with Mantine
- Handling asynchronous tests
- Mocking Firebase services
- Mocking browser APIs
- Common issues and solutions
- Running tests with Vitest

## Next Steps

1. **Continue Migration**: Use the migration guide to migrate remaining Jest tests to Vitest
2. **Remove Jest**: Once all tests are migrated, follow the removal plan to remove Jest configuration

## Testing

- All migrated tests pass with Vitest
- CI pipeline has been updated to run both Jest and Vitest tests
- Test coverage is maintained

## How to Test

1. Run Vitest tests:
   ```bash
   npm run test
   ```

2. Run Jest tests:
   ```bash
   npm run test:jest
   ```

3. Run all tests:
   ```bash
   npm run test:all
   ```

4. Run Vitest with UI:
   ```bash
   npm run test:ui
   ```

## Screenshots

![Vitest UI](https://vitest.dev/public/vitest-ui.png)

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library with Vitest](https://testing-library.com/docs/react-testing-library/setup#using-with-vitest)
- [Mantine Testing Guide](https://mantine.dev/guides/testing/)
