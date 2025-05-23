# RPG Archivist Setup Guides

This document provides comprehensive setup guides for the RPG Archivist application, including Neo4j database setup, application installation, and troubleshooting.

## Neo4j Database Setup

### Prerequisites

1. **Neo4j Desktop**: Install Neo4j Desktop from https://neo4j.com/download/

### Creating a Neo4j Database

1. **Open Neo4j Desktop**
2. **Create a New Project** (or use an existing one)
3. **Create a New Database**:
   - Click "Add Database" → "Create a Local Database"
   - Name: `RPG Archivist`
   - Password: `Lukasa666`
   - Click "Create"
4. **Start the Database**:
   - Click the "Start" button
   - Wait until the status changes to "Started"
5. **Verify Connection**:
   - The database should be accessible at `bolt://localhost:7687`
   - Username: `neo4j`
   - Password: `Lukasa666`

### Database Configuration

The application expects the following Neo4j configuration:

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=Lukasa666
NEO4J_DATABASE=neo4j
```

These settings are configured in the `.env` file in the backend directory.

## Application Setup

### Prerequisites

1. **Node.js and npm**: Make sure you have Node.js and npm installed
2. **Neo4j Desktop**: Install Neo4j Desktop and create a database as described above

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/rpg-archivist-web.git
   cd rpg-archivist-web
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   cd frontend
   npm install
   cd ../backend
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   - Copy the `.env.example` file to `.env` in the backend directory
   - Update the Neo4j connection details if necessary
   - Set `BYPASS_NEO4J=false` and `ALLOW_START_WITHOUT_DB=false`

4. **Create a Desktop Shortcut**:
   - Run the PowerShell script: `powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1`
   - This will create a shortcut on your desktop

### Running the Application

#### Option 1: Using the Desktop Shortcut (Recommended)

1. **Start Neo4j**:
   - Open Neo4j Desktop
   - Start your "RPG Archivist" database
   - Wait for it to show "Started" status

2. **Start the Application**:
   - Double-click the "RPG Archivist" shortcut on your desktop
   - The script will:
     - Check if Neo4j is running
     - Guide you through starting Neo4j if needed
     - Start the backend server
     - Start the frontend server
     - Open the application in your browser

#### Option 2: Manual Startup

1. **Start Neo4j**:
   - Open Neo4j Desktop
   - Start your "RPG Archivist" database
   - Wait for it to show "Started" status

2. **Start the Backend**:
   - Open a command prompt
   - Navigate to the backend directory: `cd backend`
   - Set environment variables:
     ```
     set NODE_ENV=development
     set BYPASS_NEO4J=false
     set ALLOW_START_WITHOUT_DB=false
     ```
   - Start the server:
     ```
     cross-env NODE_ENV=development BYPASS_NEO4J=false ALLOW_START_WITHOUT_DB=false ts-node-dev --respawn --transpile-only src/index.ts
     ```

3. **Start the Frontend**:
   - Open another command prompt
   - Navigate to the frontend directory: `cd frontend`
   - Start the server: `npm start`

4. **Access the Application**:
   - Open your browser and go to http://localhost:3000

## Troubleshooting

### Neo4j Connection Issues

1. **Check if Neo4j is Running**:
   - Open Neo4j Desktop
   - Make sure your "RPG Archivist" database is started
   - If it's not started, click the "Start" button

2. **Verify Connection Settings**:
   - Check the `.env` file in the backend directory
   - Make sure the following settings are correct:
     ```
     NEO4J_URI=bolt://localhost:7687
     NEO4J_USERNAME=neo4j
     NEO4J_PASSWORD=Lukasa666
     NEO4J_DATABASE=neo4j
     BYPASS_NEO4J=false
     ALLOW_START_WITHOUT_DB=false
     ```

3. **Test the Connection**:
   - Run the `test-neo4j-connection.bat` script
   - It should show "SUCCESS: Neo4j is running and port 7687 is accessible"

4. **Check for Port Conflicts**:
   - Make sure no other application is using port 7687
   - You can check with: `netstat -ano | findstr :7687`

5. **Restart Neo4j**:
   - If all else fails, try stopping and restarting the database in Neo4j Desktop

### Application Startup Issues

1. **Check for Port Conflicts**:
   - Make sure no other application is using ports 3000 or 4000
   - You can check with: `netstat -ano | findstr :3000` and `netstat -ano | findstr :4000`

2. **Check the Console Output**:
   - Look at the backend and frontend console windows for error messages
   - The most common issues are related to Neo4j connection or port conflicts

3. **Restart the Application**:
   - Close all command windows
   - Double-click the desktop shortcut again to restart the application

4. **Check Environment Variables**:
   - Make sure the environment variables are set correctly
   - The most important ones are `BYPASS_NEO4J=false` and `ALLOW_START_WITHOUT_DB=false`

5. **Check for Missing Dependencies**:
   - Run `npm install` in the root, frontend, and backend directories
   - Make sure all dependencies are installed correctly

### Common Error Messages

1. **"Neo4j is NOT running"**:
   - Make sure Neo4j Desktop is installed
   - Make sure a database named "RPG Archivist" exists
   - Make sure the database is started and shows "Started" status
   - Make sure the database is using the default port 7687

2. **"cross-env: The term 'cross-env' is not recognized"**:
   - Install cross-env globally: `npm install -g cross-env`
   - Or use npx: `npx cross-env ...`

3. **"Error: listen EADDRINUSE: address already in use"**:
   - Another application is using the same port
   - Find and close the application using the port
   - Or change the port in the `.env` file

4. **"Error: connect ECONNREFUSED"**:
   - The Neo4j database is not running
   - Start the database in Neo4j Desktop
   - Or check the connection settings in the `.env` file

## Development Mode Options

The following environment variables can be used to control the Neo4j database connection behavior in development mode:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Set to `development` to enable development mode | `development` |
| `BYPASS_NEO4J` | Set to `true` to bypass Neo4j database connection | `false` |
| `ALLOW_START_WITHOUT_DB` | Set to `true` to allow server to start without database connection | `false` |

### Option 1: Run with Neo4j Database (Default)

By default, the application will try to connect to the Neo4j database. This is the recommended option for development as it provides the full functionality of the application.

```bash
npm run dev
```

### Option 2: Bypass Neo4j Database

If you don't have Neo4j installed or don't want to use it during development, you can bypass the Neo4j database connection. This will allow the application to start without a database connection, but some features that require database access will not work.

```bash
BYPASS_NEO4J=true npm run dev
```

### Option 3: Allow Server to Start Without Database Connection

If you want to allow the server to start even if the Neo4j database connection fails, you can use the `ALLOW_START_WITHOUT_DB` environment variable. This is useful for development when you want to work on features that don't require database access.

```bash
ALLOW_START_WITHOUT_DB=true npm run dev
```

### Option 4: Combine Options

You can combine the options above to suit your development needs:

```bash
BYPASS_NEO4J=true ALLOW_START_WITHOUT_DB=true npm run dev
```

## Important Notes

- The application requires Neo4j to be running
- Do not set `BYPASS_NEO4J=true` or `ALLOW_START_WITHOUT_DB=true` as these will bypass the Neo4j connection
- Keep the console windows open while using the application
- To stop the application, close the console windows
