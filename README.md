# RPG Scribe

RPG Scribe is a comprehensive tool for tabletop RPG game masters and players to manage their campaign worlds, characters, locations, items, and more. It provides a rich set of features for organizing and visualizing your RPG content.

## Features

- **Entity Management**: Create and manage characters, locations, items, events, and more
- **Relationship Visualization**: Visualize relationships between entities with mind maps and timelines
- **AI Integration**: Use AI to enhance your content and generate new ideas
- **Responsive UI**: Modern, responsive UI built with Mantine 8
- **Firebase Integration**: Secure authentication and real-time database updates

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 8 or later
- Firebase account (for authentication and database)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/rpg-scribe.git
cd rpg-scribe
```

2. Install dependencies:

```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Add your Firebase configuration to `src/firebase/config.ts`

4. Start the development server:

```bash
npm start
```

## Testing

RPG Scribe uses Vitest as its testing framework.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

For more detailed information about the migration from Jest to Vitest, see [Jest to Vitest Migration Completion Report](src/tests/docs/jest-to-vitest-migration-complete.md).

## Development

### Scripts

- `npm start`: Start the development server
- `npm run build`: Build the application for production
- `npm run typecheck`: Run TypeScript type checking

### Project Structure

```
rpg-scribe/
├── public/                # Public assets
├── scripts/               # Utility scripts
├── src/                   # Source code
│   ├── components/        # React components
│   │   └── __tests__/     # Component tests
│   ├── contexts/          # React contexts
│   ├── firebase/          # Firebase configuration
│   ├── hooks/             # Custom React hooks
│   ├── models/            # TypeScript interfaces and types
│   ├── pages/             # Page components
│   ├── services/          # Service classes
│   ├── tests/             # Test files
│   │   ├── docs/          # Testing documentation
│   │   ├── templates/     # Test templates
│   │   ├── vitest/        # Vitest tests
│   │   └── vitest-utils/  # Vitest utilities and mocks
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main application component
└── memory-bank/           # Project documentation and notes
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Mantine](https://mantine.dev/) - UI component library
- [Firebase](https://firebase.google.com/) - Authentication and database
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vitest](https://vitest.dev/) - Testing framework
