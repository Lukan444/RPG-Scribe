# Git Workflow Guide for RPG Scribe

## 🚀 Quick Setup

### Initial Repository Setup
```bash
# Clone the repository
git clone https://github.com/Lukan444/RPG-Scribe.git
cd RPG-Scribe

# Install dependencies
npm install

# Set up your Git identity (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Authentication Setup
```bash
# Option 1: GitHub CLI (Recommended)
gh auth login

# Option 2: Personal Access Token
# Create a token at: https://github.com/settings/tokens
# Use token as password when prompted

# Verify authentication
gh auth status
git remote -v
```

## 🌿 Branching Strategy

### Branch Types
- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/description`** - New features
- **`bugfix/description`** - Bug fixes
- **`hotfix/description`** - Critical production fixes
- **`docs/description`** - Documentation updates
- **`refactor/description`** - Code refactoring

### Branch Naming Conventions
```bash
# Good examples
feature/user-authentication
bugfix/cache-ttl-parameter
docs/contributing-guidelines
refactor/timeline-components
hotfix/security-vulnerability

# Bad examples
feature/stuff
fix
my-branch
```

## 🔄 Development Workflow

### 1. Starting New Work
```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Start development
npm start
```

### 2. Making Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(auth): implement Google OAuth integration

- Add Google OAuth provider configuration
- Create OAuth callback handler
- Update user authentication flow
- Add tests for OAuth integration"

# Push to remote
git push origin feature/your-feature-name
```

### 3. Keeping Branch Updated
```bash
# Fetch latest changes
git fetch origin

# Rebase on main (preferred)
git rebase origin/main

# Or merge (if rebase conflicts are complex)
git merge origin/main

# Push updated branch
git push origin feature/your-feature-name --force-with-lease
```

## 📝 Commit Message Format

### Structure
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples
```bash
# Simple feature
git commit -m "feat(timeline): add event filtering by date range"

# Bug fix with details
git commit -m "fix(cache): resolve TTL parameter ignored in LocalStorageCacheTier

The optional TTL parameter was completely ignored during cache entry
creation, causing all entries to use the default TTL value.

Fixes #123"

# Breaking change
git commit -m "feat(api): update user authentication endpoint

BREAKING CHANGE: The /api/auth endpoint now requires a different
request format. Update client code accordingly."
```

## 🔍 Code Quality Checks

### Pre-commit Checklist
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test

# Build verification
npm run build
```

### Automated Checks
The CI/CD pipeline automatically runs:
- TypeScript compilation
- ESLint checks
- Vitest test suite
- Production build
- Security audit

## 🚀 Pull Request Process

### 1. Create Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Create PR via GitHub CLI
gh pr create --title "feat(timeline): add event filtering" --body "Description of changes"

# Or create via GitHub web interface
```

### 2. PR Requirements
- [ ] All CI checks pass
- [ ] Code review approved
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No merge conflicts

### 3. Merging
```bash
# Squash and merge (preferred for features)
gh pr merge --squash

# Regular merge (for hotfixes)
gh pr merge --merge

# Rebase and merge (for clean history)
gh pr merge --rebase
```

## 🔧 Troubleshooting

### Authentication Issues
```bash
# Check current authentication
gh auth status
git config --list | grep credential

# Re-authenticate
gh auth logout
gh auth login

# Clear credential cache
git config --global --unset credential.helper
git config --global credential.helper store
```

### Push Permission Denied
```bash
# Verify remote URL
git remote -v

# Update remote to use HTTPS with token
git remote set-url origin https://github.com/Lukan444/RPG-Scribe.git

# Or use SSH (if SSH key is configured)
git remote set-url origin git@github.com:Lukan444/RPG-Scribe.git
```

### Merge Conflicts
```bash
# Start merge/rebase
git rebase origin/main

# Resolve conflicts in your editor
# Then mark as resolved
git add .
git rebase --continue

# Or abort if needed
git rebase --abort
```

### Undo Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific file changes
git checkout -- filename.js

# Revert a commit (create new commit)
git revert <commit-hash>
```

## 🛡️ Security Best Practices

### Sensitive Information
- Never commit API keys, passwords, or tokens
- Use environment variables for configuration
- Add sensitive files to `.gitignore`
- Use GitHub secrets for CI/CD

### Code Review
- Review all changes before merging
- Check for security vulnerabilities
- Verify test coverage
- Ensure documentation is updated

## 📊 Monitoring and Maintenance

### Regular Tasks
```bash
# Update dependencies
npm update
npm audit fix

# Clean up merged branches
git branch --merged | grep -v main | xargs git branch -d

# Sync with upstream
git fetch origin
git checkout main
git pull origin main
```

### Repository Health
- Monitor CI/CD pipeline status
- Review security alerts
- Update dependencies regularly
- Maintain clean commit history

## 🆘 Emergency Procedures

### Hotfix Process
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make minimal changes
# Test thoroughly
# Create PR with expedited review
# Deploy immediately after merge
```

### Rollback Process
```bash
# Identify problematic commit
git log --oneline

# Create revert commit
git revert <commit-hash>

# Push revert
git push origin main

# Deploy rollback
```

## 📚 Additional Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

---

**Need Help?**
- Check existing issues and discussions
- Create a new issue with the `help-wanted` label
- Contact maintainers via GitHub discussions
