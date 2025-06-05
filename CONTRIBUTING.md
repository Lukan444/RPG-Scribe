# Contributing to RPG Scribe

Thank you for your interest in contributing to RPG Scribe! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We are committed to providing a welcoming and inclusive environment for all contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm 8.0.0 or later (or yarn 1.22.0+)
- Git
- Firebase account (for testing)

### Development Setup

1. **Fork and clone the repository:**
```bash
git clone https://github.com/your-username/RPG-Scribe.git
cd RPG-Scribe
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp .env.example .env.local
# Add your Firebase configuration
```

4. **Start development server:**
```bash
npm start
```

## 📋 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Screenshots if applicable

### Suggesting Features

1. **Check the roadmap** to see if it's already planned
2. **Use the feature request template**
3. **Provide clear use cases** and benefits
4. **Consider implementation complexity**

### Code Contributions

#### Branch Naming Convention
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(auth): add Google OAuth integration`
- `fix(ui): resolve mobile navigation issue`
- `docs(readme): update installation instructions`

## 🧪 Testing Guidelines

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

### Writing Tests
- Write tests for all new features
- Maintain or improve test coverage (minimum 80%)
- Use descriptive test names
- Follow existing test patterns
- Mock external dependencies properly

### Test Patterns and Best Practices

#### Vitest Mocking
```typescript
// Use vi.hoisted for variables needed during mock hoisting
const mockGetDoc = vi.hoisted(() => vi.fn());
const mockTimelineService = vi.hoisted(() => ({
  getTimelineEntries: vi.fn()
}));

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getDoc: mockGetDoc,
  doc: vi.fn(),
  collection: vi.fn()
}));
```

#### Fake Timers for TTL Testing
```typescript
describe('Cache TTL Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should expire cache after TTL', () => {
    cacheService.set('key', 'value', 1000);
    vi.advanceTimersByTime(1100);
    expect(cacheService.get('key')).toBeNull();
  });
});
```

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });

  it('should handle error states', () => {
    // Test error scenarios
  });
});
```

## 🎨 Code Style Guidelines

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### React Components
- Use functional components with hooks
- Follow React best practices
- Implement proper error boundaries
- Use Mantine components when possible

### File Organization
- Group related files in directories
- Use index files for clean imports
- Follow existing naming conventions
- Keep components focused and small

### CSS/Styling
- Use Mantine's styling system
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use CSS modules for component-specific styles

## 🔧 Development Workflow

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run the test suite** and ensure all tests pass
6. **Run type checking** to ensure no TypeScript errors
7. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Testing instructions

### Review Process

- All PRs require at least one review
- Address reviewer feedback promptly
- Keep PRs focused and reasonably sized
- Maintain a clean commit history

### Merge Requirements

- ✅ All tests passing
- ✅ No TypeScript errors
- ✅ Code review approved
- ✅ Documentation updated
- ✅ No merge conflicts

## 🌐 Internationalization (i18n)

### Adding New Languages
1. Create language files in `src/i18n/locales/[lang]/`
2. Follow existing namespace structure
3. Update language selector component
4. Test all UI elements in new language

### Translation Guidelines
- Use clear, concise translations
- Maintain consistent terminology
- Consider cultural context
- Test with longer text strings

## 🐛 Debugging

### Common Issues
- **Build errors**: Check TypeScript types and imports
- **Test failures**: Verify mocks and test data
- **Firebase errors**: Check configuration and rules
- **UI issues**: Test across different browsers and devices

### Debugging Tools
- React Developer Tools
- Firebase Emulator Suite
- Browser DevTools
- Vitest UI for test debugging

## 📚 Resources

### Documentation
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Mantine Documentation](https://mantine.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vitest Documentation](https://vitest.dev/)

### Project-Specific Docs
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Testing Strategy](src/tests/docs/)
- [Migration Notes](memory-bank/)

## 🎯 Contribution Areas

We especially welcome contributions in these areas:

### High Priority
- Bug fixes and stability improvements
- Test coverage improvements
- Documentation enhancements
- Accessibility improvements
- Performance optimizations

### Medium Priority
- New entity types and features
- UI/UX improvements
- Internationalization
- Mobile responsiveness
- Integration improvements

### Future Features
- AI integration enhancements
- Advanced visualization features
- Real-time collaboration
- Import/export functionality
- Plugin system development

## 📞 Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Documentation**: Check existing docs first
- **Code Review**: Ask questions in PR comments

## 🏆 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes for significant contributions
- GitHub contributor graphs
- Special mentions for major features

Thank you for contributing to RPG Scribe! 🎲✨
