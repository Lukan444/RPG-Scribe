# RPG Archivist Project Documentation

## Overview
This document provides a comprehensive overview of the RPG Archivist project, consolidating information from various documentation files.

## Project Description

### Purpose
RPG Archivist is a web application designed to help tabletop RPG players and game masters manage their campaigns, characters, locations, items, and sessions. The application provides tools for tracking relationships between entities, visualizing the game world, and using AI to enhance the storytelling experience.

### Target Audience
- **Game Masters**: Who need to manage complex campaigns with many characters, locations, and plot threads
- **Players**: Who want to keep track of their characters, relationships, and session notes
- **RPG Groups**: Who want a shared platform for their campaign information

### Key Features
- **Campaign Management**: Create and manage RPG campaigns
- **Entity Management**: Track characters, locations, items, and events
- **Relationship Management**: Manage relationships between entities
- **Mind Map Visualization**: Visualize relationships in an interactive graph
- **Session Recording**: Record and transcribe gaming sessions
- **AI Assistance**: Get AI-powered suggestions and analysis
- **Image Management**: Upload, organize, and share images

## Architecture

### Technology Stack
- **Frontend**: React, TypeScript, Material UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: Neo4j (Graph Database)
- **Cache**: Redis
- **AI Services**: Ollama, Vosk, Stable Diffusion, OpenAI, Whisper, DALL·E
- **Infrastructure**: Docker, Nginx, Prometheus, Grafana

### System Architecture
- **Client-Server Architecture**: React frontend, Node.js backend
- **RESTful API**: For communication between frontend and backend
- **Graph Database**: For storing entities and relationships
- **Provider Architecture**: For integrating AI services
- **Microservices**: For specific functionality (AI, image processing)

### Data Model
- **Graph-Based Data Model**: Entities as nodes, relationships as edges
- **Core Entities**: User, RPGWorld, Campaign, Character, Location, Item, Session, Event
- **Relationship Types**: CREATED_BY, PART_OF, LOCATED_IN, PARTICIPATED_IN, OWNS, RELATED_TO, OCCURRED_AT, INVOLVED

## Development Guidelines

### Coding Standards
- **TypeScript**: Use TypeScript for type safety
- **ESLint**: Follow ESLint rules for code quality
- **Prettier**: Use Prettier for code formatting
- **Jest**: Write tests for all functionality
- **JSDoc**: Document all functions and classes

### Git Workflow
- **Main Branch**: Production-ready code
- **Development Branch**: Integration branch for features
- **Feature Branches**: For individual features
- **Pull Requests**: Required for all changes
- **Code Review**: Required for all pull requests

### Documentation
- **README.md**: Project overview and setup instructions
- **API Documentation**: OpenAPI/Swagger for API endpoints
- **Component Documentation**: Storybook for UI components
- **User Documentation**: User guides and tutorials
- **Developer Documentation**: Setup and contribution guides

## User Guide

### Getting Started
1. **Create an Account**: Sign up for an RPG Archivist account
2. **Create a World**: Create a new RPG world
3. **Create a Campaign**: Create a new campaign within the world
4. **Add Characters**: Add player characters and NPCs
5. **Add Locations**: Add locations for your campaign
6. **Start a Session**: Record your first gaming session

### Managing Campaigns
- **Campaign Dashboard**: Overview of campaign information
- **Campaign Settings**: Configure campaign settings
- **Campaign Timeline**: View campaign events over time
- **Campaign Analytics**: View statistics about the campaign

### Managing Entities
- **Entity Creation**: Create new entities (characters, locations, items, events)
- **Entity Editing**: Edit existing entities
- **Entity Relationships**: Manage relationships between entities
- **Entity Images**: Upload and manage images for entities

### Using AI Features
- **AI Brain**: Get AI-powered suggestions and analysis
- **Session Transcription**: Transcribe gaming sessions
- **Content Generation**: Generate content for your campaign
- **Image Generation**: Generate images for entities

## Developer Guide

### Setting Up the Development Environment
1. **Clone the Repository**: `git clone https://github.com/username/rpg-archivist.git`
2. **Install Dependencies**: `npm install` in both frontend and backend directories
3. **Set Up Environment Variables**: Create `.env` files based on `.env.example`
4. **Start Docker Services**: `docker-compose up -d`
5. **Start Development Servers**: `npm run dev` in both frontend and backend directories

### Project Structure
- **frontend/**: React frontend application
- **backend/**: Node.js backend application
- **docker/**: Docker configuration files
- **scripts/**: Utility scripts
- **docs/**: Documentation files

### Adding New Features
1. **Create a Feature Branch**: `git checkout -b feature/new-feature`
2. **Implement the Feature**: Follow coding standards and guidelines
3. **Write Tests**: Ensure good test coverage
4. **Update Documentation**: Document the new feature
5. **Create a Pull Request**: Submit for review

### Troubleshooting
- **Common Issues**: Solutions for common development issues
- **Debugging**: Tips for debugging the application
- **Logging**: How to use the logging system
- **Error Handling**: How to handle and report errors

## Deployment Guide

### Production Deployment
1. **Set Up Production Server**: Install required software
2. **Configure Environment Variables**: Set up production environment variables
3. **Build the Application**: Create production builds
4. **Deploy with Docker**: Use Docker Compose for deployment
5. **Set Up Nginx**: Configure Nginx as a reverse proxy
6. **Set Up SSL**: Configure SSL certificates
7. **Set Up Monitoring**: Configure Prometheus and Grafana

### Maintenance
- **Backups**: Regular database backups
- **Updates**: Keeping the application up to date
- **Monitoring**: Monitoring system health
- **Scaling**: Scaling the application for more users

### Disaster Recovery
- **Backup Strategy**: How backups are created and stored
- **Recovery Procedures**: Steps to recover from failures
- **Failover**: Automatic failover configuration
- **Testing**: Regular testing of recovery procedures

## Monetization Strategy

### Subscription Tiers
- **Free Tier**: Basic features with community providers
- **Basic Tier**: Enhanced features with limited premium providers
- **Pro Tier**: All features with all premium providers
- **Enterprise Tier**: Custom features and support

### Feature Comparison
- **Free Tier Features**: Core functionality, community providers
- **Basic Tier Features**: Enhanced functionality, limited premium providers
- **Pro Tier Features**: All functionality, all premium providers
- **Enterprise Tier Features**: Custom functionality, dedicated support

### Payment Processing
- **Stripe Integration**: For subscription payments
- **Cryptocurrency Integration**: For alternative payments
- **Invoicing**: For enterprise customers
- **Refund Policy**: Guidelines for refunds

## Security Policy

### Supported Versions
- **Current Version**: Full support
- **Previous Version**: Security updates only
- **Older Versions**: No support

### Reporting a Vulnerability
- **Responsible Disclosure**: Guidelines for reporting vulnerabilities
- **Bug Bounty Program**: Rewards for finding vulnerabilities
- **Security Contact**: Email for security issues
- **PGP Key**: For encrypted communication

### Security Measures
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based and entity-based access control
- **Data Protection**: Encryption at rest and in transit
- **Vulnerability Scanning**: Regular security scans
- **Penetration Testing**: Regular security testing

## Conclusion
RPG Archivist is a comprehensive web application for tabletop RPG campaign management, with a focus on relationship management, visualization, and AI assistance. The application is built with modern technologies and follows best practices for development, deployment, and security. The documentation provides a comprehensive guide for users, developers, and administrators, ensuring a smooth experience for all stakeholders.
