# Node.js OpenSSL Legacy Provider Fix

## Overview

This document details the solution implemented to fix the Node.js OpenSSL error in the RPG Archivist application. The error was occurring because the application was using an older version of webpack with a newer version of Node.js (v22.14.0).

## Problem Description

When starting the application with `npm start`, the following error was encountered:

```
Error: error:0308010C:digital envelope routines::unsupported
    at new Hash (node:internal/crypto/hash:79:19)
    at Object.createHash (node:crypto:139:10)
    at module.exports (D:\AI Projects\RPG-Archivist-Web\frontend\node_modules\webpack\lib\util\createHash.js:90:53)
```

This error occurs because Node.js v17+ has removed support for the MD4 hashing algorithm by default, which is used by webpack 4 (the version used by react-scripts 3.x).

## Solution Implemented

We implemented the following changes to fix the Node.js OpenSSL error:

### 1. Added NODE_OPTIONS Environment Variable

We added the `NODE_OPTIONS=--openssl-legacy-provider` environment variable to all relevant npm scripts in the package.json files:

```json
"scripts": {
  "start": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts start",
  "start:frontend": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts start",
  "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts build",
  "test": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts test",
  "test:coverage": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts test --coverage",
  "a11y:components": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts test --testMatch='**/*.a11y.test.{ts,tsx}'"
}
```

This environment variable enables the legacy OpenSSL provider in Node.js, which includes support for the MD4 hashing algorithm.

### 2. Added cross-env Package

We added the `cross-env` package to both the frontend and root package.json files to ensure the environment variable works across different operating systems:

```json
"devDependencies": {
  "cross-env": "^7.0.3"
}
```

### 3. Created a Batch Script for Windows

We created a batch script (`start-dev.bat`) to set the environment variable before starting the application:

```batch
@echo off
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

This provides an alternative way to start the application with the required environment variable.

## Benefits of the Solution

1. **Compatibility**: The application can now run on newer versions of Node.js (v17+) without errors.
2. **No Code Changes**: The solution doesn't require any changes to the application code or webpack configuration.
3. **Cross-Platform**: The solution works on all operating systems thanks to the cross-env package.

## Future Improvements

1. **Upgrade webpack**: Consider upgrading to webpack 5, which doesn't rely on the MD4 hashing algorithm.
2. **Upgrade react-scripts**: Upgrade to react-scripts 4.x or 5.x, which use webpack 5.
3. **Use Create React App v5**: Consider migrating to Create React App v5, which includes all the necessary updates.

## Related Files

- `frontend/package.json` - Updated scripts with NODE_OPTIONS environment variable
- `package.json` - Updated scripts and added cross-env dependency
- `frontend/start-dev.bat` - Batch script for Windows users

## Note on Previous Fixes

This fix builds on the previous fixes for the chunk loading error and frontend startup issues. The application now has:

1. A robust error boundary for chunk loading errors
2. A service worker to handle chunk loading errors
3. A fix for the babel-jest dependency conflict
4. A fix for the Node.js OpenSSL error

These changes ensure that the application can start and run reliably on modern development environments.
