# Infrastructure Overview for RPG Archivist

## Overview
This document provides a comprehensive overview of the infrastructure for the RPG Archivist application, consolidating information from various infrastructure-focused files.

## Development Environment

### Docker Compose Setup
- **docker-compose.yml**: Main Docker Compose file for development
- **docker-compose.override.yml**: Override file for development-specific settings
- **docker-compose.prod.yml**: Production Docker Compose file
- **docker-compose.monitoring.yml**: Monitoring Docker Compose file

### Services
- **frontend**: React frontend application
- **backend**: Node.js backend application
- **neo4j**: Neo4j database
- **redis**: Redis cache
- **ollama**: Ollama LLM service
- **vosk**: Vosk STT service
- **stable-diffusion**: Stable Diffusion IMG service
- **nginx**: Nginx reverse proxy

### Development Scripts
- **scripts/start.sh**: Starts the development environment
- **scripts/stop.sh**: Stops the development environment
- **scripts/reset.sh**: Resets the development environment
- **scripts/logs.sh**: Shows logs for the development environment
- **scripts/backup.sh**: Creates a backup of the development environment
- **scripts/restore.sh**: Restores a backup of the development environment

## Production Environment

### Server Requirements
- **CPU**: 4+ cores
- **RAM**: 16+ GB
- **Storage**: 100+ GB SSD
- **OS**: Ubuntu 22.04 LTS

### Deployment
- **CI/CD Pipeline**: GitHub Actions
- **Deployment Script**: scripts/deploy.sh
- **Rollback Script**: scripts/rollback.sh
- **Backup Script**: scripts/backup-prod.sh
- **Restore Script**: scripts/restore-prod.sh

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Loki**: Log aggregation
- **Alertmanager**: Alerting
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics

## Database Management

### Neo4j Database
- **Version**: Neo4j 5.x
- **Authentication**: Username/password
- **Backup**: scripts/backup-neo4j.sh
- **Restore**: scripts/restore-neo4j.sh
- **Monitoring**: Neo4j metrics in Prometheus/Grafana

### Schema Management
- **SchemaValidator**: Validates the database schema
- **SchemaMigration**: Manages schema migrations
- **SchemaBackup**: Creates backups before migrations
- **SchemaRestore**: Restores backups if migrations fail

### Data Management
- **DataImport**: Imports data from CSV files
- **DataExport**: Exports data to CSV files
- **DataBackup**: Creates backups of data
- **DataRestore**: Restores data from backups

## Security

### Authentication
- **JWT**: JSON Web Tokens for authentication
- **Refresh Tokens**: For token refresh
- **Password Hashing**: bcrypt for password hashing
- **Rate Limiting**: To prevent brute force attacks

### Authorization
- **Role-Based Access Control**: Admin, Game Master, Player roles
- **Entity-Based Access Control**: Access based on entity ownership
- **Permission System**: Fine-grained permissions for actions

### API Security
- **HTTPS**: TLS/SSL for all communications
- **CORS**: Cross-Origin Resource Sharing configuration
- **CSP**: Content Security Policy
- **XSS Protection**: Cross-Site Scripting protection
- **CSRF Protection**: Cross-Site Request Forgery protection

### Data Security
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS for all communications
- **Data Backup**: Regular backups of all data
- **Data Retention**: Policy for data retention and deletion

## Performance Optimization

### Caching
- **Redis**: For caching frequently accessed data
- **Browser Caching**: For static assets
- **Query Caching**: For expensive database queries
- **Response Caching**: For API responses

### Database Optimization
- **Indexing**: Proper indexing of database fields
- **Query Optimization**: Optimized Cypher queries
- **Connection Pooling**: For efficient database connections
- **Read Replicas**: For scaling read operations

### Frontend Optimization
- **Code Splitting**: For faster initial load
- **Lazy Loading**: For components and routes
- **Image Optimization**: For faster image loading
- **Bundle Size Optimization**: For smaller JavaScript bundles

### Backend Optimization
- **Clustering**: For horizontal scaling
- **Load Balancing**: For distributing traffic
- **Rate Limiting**: For preventing abuse
- **Request Batching**: For reducing API calls

## Continuous Integration/Continuous Deployment

### CI Pipeline
- **Linting**: ESLint for code quality
- **Testing**: Jest for unit and integration tests
- **Building**: Webpack for frontend, TypeScript for backend
- **Security Scanning**: For vulnerabilities

### CD Pipeline
- **Deployment**: Automated deployment to production
- **Rollback**: Automated rollback if deployment fails
- **Monitoring**: Automated monitoring after deployment
- **Notification**: Alerts for deployment status

### Testing
- **Unit Tests**: For individual components and functions
- **Integration Tests**: For API endpoints and services
- **End-to-End Tests**: For user flows
- **Performance Tests**: For performance benchmarks

### Documentation
- **API Documentation**: OpenAPI/Swagger for API endpoints
- **Code Documentation**: JSDoc for code documentation
- **User Documentation**: User guides and tutorials
- **Developer Documentation**: Setup and contribution guides

## Desktop Application Launcher

### Launcher Features
- **One-Click Start**: Starts all services with one click
- **Status Monitoring**: Shows status of all services
- **Log Viewing**: Shows logs for all services
- **Configuration**: Allows configuration of services
- **Auto-Update**: Automatically updates the launcher

### Implementation
- **Electron**: For cross-platform desktop application
- **PowerShell Scripts**: For Windows-specific functionality
- **Bash Scripts**: For Linux/Mac-specific functionality
- **Configuration UI**: For configuring the launcher
- **Status UI**: For monitoring service status

### Installation
- **Windows Installer**: MSI installer for Windows
- **Mac Installer**: DMG installer for Mac
- **Linux Installer**: DEB/RPM installers for Linux
- **Portable Version**: ZIP/TAR.GZ for portable use
- **Auto-Update**: Automatically updates the launcher

## Conclusion
The infrastructure for RPG Archivist provides a robust foundation for the application, with comprehensive development and production environments, database management, security, performance optimization, and CI/CD pipelines. The desktop application launcher provides an easy way for users to run the application locally, with one-click start and status monitoring. The infrastructure is designed to be scalable, secure, and performant, providing a solid foundation for the application to grow and evolve over time.
