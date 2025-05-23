# Dependency Vulnerabilities Plan

## Overview

This document outlines a plan to address the dependency vulnerabilities identified in the RPG Archivist application. The npm audit report shows 188 vulnerabilities (2 low, 127 moderate, 50 high, 9 critical) across various dependencies.

## Current State

The npm audit report shows vulnerabilities in several key dependencies:

- Material UI related packages
- React Scripts and related packages
- Development tools like lighthouse-ci
- Various utility packages with known vulnerabilities

## Recommended Approach

Rather than using `npm audit fix --force`, which would make breaking changes to the application, we recommend a more controlled approach to updating dependencies:

### 1. Prioritize Critical Vulnerabilities

Focus first on the 9 critical vulnerabilities:

- `chrome-launcher` (OS Command Injection)
- `loader-utils` (Prototype pollution and ReDoS)
- `minimist` (Prototype Pollution)
- `shell-quote` (Command Injection)
- `xmldom` (Misinterpretation of malicious XML input)

### 2. Create a Dependency Update Plan

1. **Create a separate branch** for dependency updates
2. **Update dependencies in small batches** to isolate issues
3. **Test thoroughly** after each batch of updates
4. **Document changes** and any required code modifications

### 3. Specific Update Recommendations

#### Critical Vulnerabilities

1. **loader-utils**: Update to version 2.0.0 or later
   ```
   npm install --save-dev loader-utils@^2.0.0
   ```

2. **minimist**: Update to version 1.2.6 or later
   ```
   npm install --save-dev minimist@^1.2.6
   ```

3. **shell-quote**: Update to version 1.7.3 or later
   ```
   npm install --save-dev shell-quote@^1.7.3
   ```

4. **chrome-launcher**: Update to version 0.14.0 or later
   ```
   npm install --save-dev chrome-launcher@^0.14.0
   ```

5. **xmldom**: Update to a secure alternative like `@xmldom/xmldom`
   ```
   npm uninstall xmldom
   npm install --save-dev @xmldom/xmldom
   ```

#### High Vulnerabilities

1. **ansi-html**: Update to version 0.0.8 or later
   ```
   npm install --save-dev ansi-html@^0.0.8
   ```

2. **braces**: Update to version 3.0.3 or later
   ```
   npm install --save-dev braces@^3.0.3
   ```

3. **node-forge**: Update to version 1.3.0 or later
   ```
   npm install --save-dev node-forge@^1.3.0
   ```

4. **nth-check**: Update to version 2.0.1 or later
   ```
   npm install --save-dev nth-check@^2.0.1
   ```

5. **terser**: Update to version 4.8.1 or later
   ```
   npm install --save-dev terser@^4.8.1
   ```

### 4. Consider Major Dependency Updates

For a more comprehensive solution, consider updating major dependencies:

1. **React Scripts**: Update to version 5.0.1
   ```
   npm install --save-dev react-scripts@5.0.1
   ```
   This would fix many vulnerabilities but would require testing for breaking changes.

2. **Material UI**: Ensure all Material UI packages are on the same version
   ```
   npm install @mui/material@5.15.2 @mui/icons-material@5.15.2 @mui/lab@5.0.0-alpha.155 @mui/x-date-pickers@8.0.0 @mui/x-tree-view@8.2.0
   ```

### 5. Development Dependencies

For development-only dependencies with vulnerabilities:

1. **lighthouse-ci**: Consider updating or removing if not essential
   ```
   npm uninstall lighthouse-ci
   npm install --save-dev lighthouse-ci@latest
   ```

2. **Deprecated packages**: Replace deprecated packages with recommended alternatives
   ```
   npm uninstall request request-promise-native
   npm install --save-dev node-fetch@2
   ```

## Implementation Plan

1. **Create a dependency update branch**
   ```
   git checkout -b dependency-updates
   ```

2. **Update critical vulnerabilities first**
   ```
   npm install --save-dev loader-utils@^2.0.0 minimist@^1.2.6 shell-quote@^1.7.3 chrome-launcher@^0.14.0
   npm uninstall xmldom
   npm install --save-dev @xmldom/xmldom
   ```

3. **Test the application**
   ```
   npm run test
   npm run start
   ```

4. **Update high vulnerabilities**
   ```
   npm install --save-dev ansi-html@^0.0.8 braces@^3.0.3 node-forge@^1.3.0 nth-check@^2.0.1 terser@^4.8.1
   ```

5. **Test the application again**
   ```
   npm run test
   npm run start
   ```

6. **Consider major dependency updates**
   - Research breaking changes in React Scripts 5.0.1
   - Create a separate branch for major updates if needed

7. **Document all changes**
   - Update package.json and package-lock.json
   - Document any code changes required for compatibility
   - Create a migration guide for other developers

## Conclusion

Addressing dependency vulnerabilities is important for security, but it should be done in a controlled manner to avoid breaking the application. This plan provides a step-by-step approach to update dependencies while minimizing risk.

The most critical vulnerabilities should be addressed first, followed by high and moderate vulnerabilities. Major dependency updates should be considered separately and tested thoroughly before implementation.

## References

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Security Advisories](https://github.com/advisories)
- [Material UI documentation](https://mui.com/material-ui/getting-started/installation/)
- [Create React App documentation](https://create-react-app.dev/docs/updating-to-new-releases/)
