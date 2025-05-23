# RPG Scribe

[![Build Status](https://github.com/Lukan444/RPG-Scribe/workflows/CI/badge.svg)](https://github.com/Lukan444/RPG-Scribe/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Mantine](https://img.shields.io/badge/Mantine-8.0.1-339af0.svg)](https://mantine.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.0-orange.svg)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **A modern React/TypeScript RPG campaign management tool with Mantine UI and Firebase integration**

RPG Scribe is a comprehensive digital tool designed for tabletop RPG game masters and players to manage their campaign worlds, characters, locations, items, and narrative elements. Built with modern web technologies, it provides an intuitive interface for organizing, visualizing, and enhancing your RPG content with AI-powered features.

## ✨ Key Features

### 🎭 **Comprehensive Entity Management**
- **Characters & NPCs**: Detailed character sheets with relationships and backstories
- **Campaigns & Sessions**: Track campaign progress and session notes
- **Locations**: Build rich world geography with interconnected places
- **Items & Equipment**: Manage magical items, weapons, and treasures
- **Events & Timeline**: Chronicle important story moments
- **Factions**: Organize political groups and their relationships
- **Story Arcs**: Structure your narrative with connected plot threads

### 🎨 **Modern User Interface**
- **Mantine 8 UI**: Beautiful, accessible components with dark/light theme support
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Internationalization**: Multi-language support (English, Polish) with easy expansion
- **Intuitive Navigation**: Hierarchical organization with collapsible menus

### 🔗 **Relationship & Visualization**
- **Interactive Mind Maps**: Visualize entity connections and dependencies
- **Relationship Web**: Explore complex character and faction relationships
- **Timeline Views**: Track chronological events and story progression
- **Entity Counters**: Real-time relationship statistics and analytics

### 🤖 **AI-Powered Features**
- **Vector Database Integration**: Google Vertex AI for semantic search
- **Content Enhancement**: AI-assisted world-building and character development
- **Session Analysis**: Automated transcript processing and entity recognition
- **Smart Suggestions**: Context-aware content recommendations

### 🔐 **Secure & Scalable**
- **Firebase Authentication**: Email/password and Google OAuth integration
- **Real-time Database**: Firestore with offline support and sync
- **User Management**: Role-based access and collaborative features
- **Data Security**: Comprehensive security rules and validation

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 8.0.0 or later (or **yarn** 1.22.0+)
- **Firebase account** (for authentication and database)
- **Git** for version control

### 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Lukan444/RPG-Scribe.git
cd RPG-Scribe
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
```

3. **Firebase Setup:**

   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

   b. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google providers

   c. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in test mode (configure security rules later)

   d. Configure Firebase in your project:
   - Copy your Firebase config from Project Settings
   - Update `src/firebase/config.ts` with your configuration

   e. Set up Firestore Security Rules:
   - Deploy the rules from `firestore.rules`
   - Configure indexes from `firestore.indexes.json`

4. **Environment Configuration:**
```bash
# Create environment file
cp .env.example .env.local

# Add your Firebase configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config values
```

5. **Start the development server:**
```bash
npm start
# or
yarn start
```

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Create an account or sign in to start using RPG Scribe

## 🧪 Testing

RPG Scribe uses **Vitest** as its testing framework, providing fast and reliable testing with excellent TypeScript support.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Type checking
npm run typecheck
```

### Test Structure
- **Unit Tests**: Component and service testing with mocks
- **Integration Tests**: Firebase service integration testing
- **Vitest Configuration**: Optimized for React and TypeScript
- **Coverage Reports**: Comprehensive test coverage tracking

For detailed information about our testing migration, see [Jest to Vitest Migration Report](src/tests/docs/jest-to-vitest-migration-complete.md).

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start development server (localhost:3000)
npm run build          # Build for production
npm run typecheck      # TypeScript type checking

# Testing
npm test               # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage

# Linting & Formatting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier
```

### 📁 Project Structure

```
RPG-Scribe/
├── .github/               # GitHub workflows and templates
├── public/                # Static assets and localization files
│   ├── locales/          # i18n translation files
│   └── index.html        # HTML template
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Shared/reusable components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── entities/     # Entity management components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout and navigation
│   │   ├── relationships/ # Relationship management
│   │   └── visualizations/ # Data visualization components
│   ├── contexts/          # React Context providers
│   ├── firebase/          # Firebase configuration
│   ├── hooks/             # Custom React hooks
│   ├── i18n/             # Internationalization setup
│   ├── models/           # TypeScript interfaces and types
│   ├── pages/            # Page components
│   ├── services/         # Business logic and API services
│   ├── tests/            # Test files and utilities
│   ├── theme/            # Mantine theme configuration
│   ├── types/            # Global TypeScript types
│   └── utils/            # Utility functions
├── functions/             # Firebase Cloud Functions
├── memory-bank/          # Project documentation and notes
└── docs/                 # Additional documentation
```

## 🏗️ Technology Stack

### Frontend
- **React 18.2.0** - Modern UI library with hooks and concurrent features
- **TypeScript 5.3.3** - Type-safe JavaScript with excellent IDE support
- **Mantine 8.0.1** - Feature-rich React components library
- **React Router 6** - Declarative routing for React applications
- **Framer Motion** - Production-ready motion library for React

### Backend & Database
- **Firebase 10.7.0** - Backend-as-a-Service platform
- **Firestore** - NoSQL document database with real-time sync
- **Firebase Auth** - Authentication with multiple providers
- **Firebase Functions** - Serverless backend functions
- **Google Vertex AI** - Vector database and AI services

### Development Tools
- **Vitest** - Fast unit testing framework
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **Craco** - Create React App configuration override
- **PostCSS** - CSS processing and optimization

### Build & Deployment
- **Create React App** - Zero-configuration React build setup
- **GitHub Actions** - CI/CD pipeline
- **Firebase Hosting** - Static site hosting
- **npm/yarn** - Package management

## 🗺️ Roadmap

### ✅ **Phase 1: Foundation (Completed)**
- [x] Migration from Material UI to Mantine 8
- [x] TypeScript implementation and type safety
- [x] Firebase authentication and Firestore integration
- [x] Basic entity management (Characters, Campaigns, Locations, etc.)
- [x] Internationalization (i18n) with English and Polish support
- [x] Testing framework migration from Jest to Vitest
- [x] Responsive UI design and accessibility improvements

### 🚧 **Phase 2: Enhanced Features (In Progress)**
- [ ] Advanced relationship visualization and mind maps
- [ ] Real-time collaboration features
- [ ] Enhanced AI integration with Vertex AI
- [ ] Advanced search and filtering capabilities
- [ ] Import/export functionality for campaign data
- [ ] Mobile app development (React Native)

### 🔮 **Phase 3: Advanced AI & Analytics (Planned)**
- [ ] AI-powered content generation and suggestions
- [ ] Session transcript analysis and automated note-taking
- [ ] Predictive analytics for campaign planning
- [ ] Voice-to-text integration for live sessions
- [ ] Advanced data visualization and reporting
- [ ] Integration with popular VTT platforms

### 🌟 **Phase 4: Community & Ecosystem (Future)**
- [ ] Public campaign sharing and marketplace
- [ ] Plugin system for custom extensions
- [ ] API for third-party integrations
- [ ] Advanced user roles and permissions
- [ ] Multi-tenant organization support
- [ ] Enterprise features and deployment options

## 📊 Project Status

**Current Version:** 1.0.0 (Initial Release)
**Migration Status:** ✅ Complete - Successfully migrated from Material UI to Mantine 8
**Test Coverage:** 85%+ with Vitest framework
**Internationalization:** English (100%), Polish (100%)
**Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before getting started.

### Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/RPG-Scribe.git
   cd RPG-Scribe
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Make your changes** and add tests
6. **Run tests** to ensure everything works:
   ```bash
   npm test
   npm run typecheck
   ```
7. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
8. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
9. **Create a Pull Request** on GitHub

### Development Guidelines

- Follow TypeScript best practices and maintain type safety
- Write tests for new features and bug fixes
- Follow the existing code style and conventions
- Update documentation for any new features
- Ensure all tests pass before submitting PR
- Keep commits atomic and write clear commit messages

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Mantine](https://mantine.dev/)** - Excellent React components library
- **[Firebase](https://firebase.google.com/)** - Reliable backend infrastructure
- **[React](https://reactjs.org/)** - Powerful UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Vitest](https://vitest.dev/)** - Fast and reliable testing framework
- **[Tabler Icons](https://tabler-icons.io/)** - Beautiful icon set
- **[React Router](https://reactrouter.com/)** - Declarative routing
- **[i18next](https://www.i18next.com/)** - Internationalization framework

## 📞 Support

- **Documentation**: Check our [docs](docs/) directory
- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/Lukan444/RPG-Scribe/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/Lukan444/RPG-Scribe/discussions)

---

**Made with ❤️ for the RPG community**
