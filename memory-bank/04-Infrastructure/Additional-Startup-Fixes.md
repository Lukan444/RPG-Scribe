# Additional Startup Fixes

## Overview

This document details additional fixes implemented to resolve startup issues in the RPG Archivist application. These fixes address two main problems:

1. Port conflict with the backend server
2. Module resolution error with the vfile package

## Problem Description

After implementing the previous fixes for the Node.js OpenSSL error, we encountered two new issues:

1. **Port Conflict**: The backend server failed to start with the error `Error: listen EADDRINUSE: address already in use :::4000`. This indicates that another process was already using port 4000.

2. **Module Resolution Error**: The frontend failed to compile with the error `Module not found: Can't resolve '#minpath' in 'D:\AI Projects\RPG-Archivist-Web\node_modules\vfile\lib'`. This is a dependency issue with the vfile package, which uses a Node.js-specific import syntax that webpack doesn't understand.

## Solution Implemented

We implemented the following changes to fix these issues:

### 1. Port Conflict Fix

We created a script to kill any processes using port 4000:

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

This script can be run before starting the application to ensure that port 4000 is available for the backend server.

### 2. Module Resolution Fix

We implemented a custom webpack configuration using react-app-rewired to resolve the #minpath import:

1. **Created a polyfill for #minpath**:
   ```javascript
   // frontend/patches/vfile-fix.js
   const path = require('path');
   module.exports = path;
   ```

2. **Created a webpack configuration**:
   ```javascript
   // frontend/webpack.config.js
   const path = require('path');
   
   module.exports = function override(config) {
     config.resolve = {
       ...config.resolve,
       alias: {
         ...config.resolve.alias,
         '#minpath': path.resolve(__dirname, 'patches/vfile-fix.js')
       }
     };
     
     return config;
   };
   ```

3. **Updated package.json scripts to use react-app-rewired**:
   ```json
   "scripts": {
     "start": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-app-rewired start",
     "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-app-rewired build",
     "test": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-app-rewired test"
   }
   ```

4. **Added react-app-rewired to devDependencies**:
   ```json
   "devDependencies": {
     "react-app-rewired": "^2.2.1"
   }
   ```

### 3. Updated Startup Scripts

We updated the run-frontend.bat script to include the NODE_OPTIONS environment variable:

```batch
@echo off
cd frontend
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

This ensures that the frontend starts with the legacy OpenSSL provider enabled.

## Benefits of the Solution

1. **Resolved Port Conflict**: The kill-port-4000.bat script ensures that port 4000 is available for the backend server.
2. **Fixed Module Resolution**: The custom webpack configuration resolves the #minpath import, allowing the frontend to compile successfully.
3. **Simplified Startup**: The updated run-frontend.bat script includes the necessary environment variable, making it easier to start the application.

## Future Improvements

1. **Dependency Updates**: Consider updating dependencies to versions that don't have these issues.
2. **Port Configuration**: Make the backend port configurable to avoid conflicts.
3. **Build System Upgrade**: Consider upgrading to a newer version of Create React App or another build system like Vite.

## Related Files

- `kill-port-4000.bat` - Script to kill processes using port 4000
- `frontend/patches/vfile-fix.js` - Polyfill for #minpath
- `frontend/webpack.config.js` - Custom webpack configuration
- `frontend/package.json` - Updated scripts and dependencies
- `run-frontend.bat` - Updated startup script
