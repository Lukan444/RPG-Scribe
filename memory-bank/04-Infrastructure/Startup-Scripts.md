# Startup Scripts for RPG Archivist

## Overview

This document details the various startup scripts created to help run the RPG Archivist application with different configurations and fixes. These scripts address several issues encountered during startup, including:

1. Port conflicts with the backend server
2. Node.js OpenSSL compatibility issues
3. Module resolution errors with dependencies
4. TypeScript version compatibility warnings

## Available Scripts

### 1. run-frontend-simple.bat

This script starts the frontend with a simplified approach that disables problematic dependencies and sets necessary environment variables:

```batch
@echo off
cd frontend
set SKIP_PREFLIGHT_CHECK=true
set NODE_OPTIONS=--openssl-legacy-provider
set DISABLE_ESLINT_PLUGIN=true
set TSC_COMPILE_ON_ERROR=true
set GENERATE_SOURCEMAP=false
set REACT_APP_DISABLE_REMARK=true
npm start
```

Use this script when you want to run only the frontend with all the necessary fixes.

### 2. run-backend.bat

This script kills any processes using port 4000 and then starts the backend server:

```batch
@echo off
echo Killing processes on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)
echo Done.

cd backend
set NODE_ENV=development
set BYPASS_NEO4J=false
set ALLOW_START_WITHOUT_DB=false
echo Starting backend with Neo4j connection ENABLED...
cross-env NODE_ENV=development BYPASS_NEO4J=false ALLOW_START_WITHOUT_DB=false ts-node-dev --respawn --transpile-only src/index.ts
```

Use this script when you want to run only the backend server.

### 3. kill-port-4000.bat

This script kills any processes using port 4000:

```batch
@echo off
echo Killing processes on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)
echo Done.
pause
```

Use this script when you encounter the "address already in use" error for port 4000.

### 4. start-fixed-app.bat

This script combines all the fixes and starts both the frontend and backend:

```batch
@echo off
echo Killing processes on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)
echo Done.

echo Installing polyfills...
cd frontend
npm install --save-dev path-browserify os-browserify stream-browserify buffer process util react-app-rewired
cd ..

echo Starting the application...
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

Use this script when you want to run the complete application with all fixes.

### 5. install-polyfills.bat

This script installs the necessary polyfills for the webpack configuration:

```batch
@echo off
cd frontend
npm install --save-dev path-browserify os-browserify stream-browserify buffer process util
```

Use this script when you need to install the polyfills for the webpack configuration.

## Environment Variables

The following environment variables are used in the scripts:

- `SKIP_PREFLIGHT_CHECK=true`: Bypasses the dependency conflict check
- `NODE_OPTIONS=--openssl-legacy-provider`: Enables the legacy OpenSSL provider for Node.js v17+
- `DISABLE_ESLINT_PLUGIN=true`: Disables the ESLint plugin to avoid TypeScript version compatibility issues
- `TSC_COMPILE_ON_ERROR=true`: Allows TypeScript to compile even with errors
- `GENERATE_SOURCEMAP=false`: Disables source map generation to improve performance
- `REACT_APP_DISABLE_REMARK=true`: Disables the remark plugin that causes the #minpath import error

## Configuration Files

### 1. config-overrides.js

This file provides a custom webpack configuration for react-app-rewired:

```javascript
const path = require('path');
const fs = require('fs');

module.exports = function override(config, env) {
  // Add fallback for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: false,
    os: require.resolve('os-browserify/browser'),
    util: require.resolve('util/'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
  };

  // Add plugins to provide global variables
  const webpack = require('webpack');
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
```

### 2. .env.development

This file sets environment variables for the development environment:

```
SKIP_PREFLIGHT_CHECK=true
NODE_OPTIONS=--openssl-legacy-provider
DISABLE_ESLINT_PLUGIN=true
TSC_COMPILE_ON_ERROR=true
GENERATE_SOURCEMAP=false
REACT_APP_DISABLE_REMARK=true
```

## Recommended Approach

For the most reliable startup experience, follow these steps:

1. Run `kill-port-4000.bat` to ensure port 4000 is available
2. Run `install-polyfills.bat` to install the necessary polyfills
3. Start the application using one of the following methods:
   - Run `start-fixed-app.bat` to start both frontend and backend
   - Run `run-frontend-simple.bat` and `run-backend.bat` in separate terminals

If you encounter any issues, check the console output for specific error messages and refer to the appropriate fix in this document.
