# Contributing to SkillForge

Thank you for your interest in contributing to SkillForge! This document provides guidelines and instructions for contributing to this project.

## 🎯 Purpose

This project serves as a learning platform for UTP students to:
- Practice real-world Git workflows
- Learn collaborative development
- Understand code review processes
- Build portfolio-worthy projects

## 📋 Code of Conduct

- Be respectful and constructive
- Help fellow students learn and grow
- Ask questions when unsure
- Share knowledge and best practices
- Give and receive feedback gracefully

## 🔧 Development Workflow

### 1. Setting Up Your Environment

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/skillforge.git
   cd skillforge
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/VUTP-University/skillforge.git
   ```

### 2. Creating a Branch

Always create a new branch for your work:

```bash
# Update your local master branch
git checkout master
git pull upstream master

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions:**
- `feature/` - New features (e.g., `feature/user-authentication`)
- `bugfix/` - Bug fixes (e.g., `bugfix/login-error`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `refactor/` - Code refactoring (e.g., `refactor/database-queries`)
- `test/` - Test additions or updates (e.g., `test/user-service`)

### 3. Making Changes

1. **Write clean code** following the project's style guidelines
2. **Test your changes** thoroughly
3. **Commit regularly** with clear, descriptive messages
4. **Keep commits focused** - one logical change per commit

#### Commit Message Format

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Example:**
```bash
git commit -m "feat: add user profile page

- Created profile component
- Added profile route
- Implemented profile API endpoint"
```

### 4. Code Quality Standards

#### Python Code
- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints where applicable
- Run `black` for formatting: `black .`
- Run `ruff` for linting: `ruff check .`
- Avoid `print()` statements in production code (use logging)

#### JavaScript/TypeScript Code
- Follow the project's ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Avoid `console.log()` in production code

#### General Practices
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Handle errors appropriately
- Write unit tests for new features

### 5. Testing Your Changes

Before submitting a pull request:

```bash
# For Python code
black --check .
ruff check .

# For JavaScript/TypeScript code
npm run lint
npm run test

# Run the application locally to verify changes work
```

### 6. Submitting a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Go to the [skillforge repository](https://github.com/VUTP-University/skillforge)
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template completely

3. **PR Requirements:**
   - Link to the related issue
   - Provide a clear description of changes
   - Include screenshots for UI changes
   - Ensure all CI checks pass
   - Request review from instructors or team leads

4. **Code Review Process:**
   - Address all review comments
   - Make requested changes in new commits
   - Re-request review after updates
   - Be patient and responsive

### 7. After Your PR is Merged

1. **Update your local repository:**
   ```bash
   git checkout master
   git pull upstream master
   ```

2. **Delete your feature branch:**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots or error logs

## ✨ Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Feature description
- Problem it solves
- Proposed solution
- Acceptance criteria

## 💬 Getting Help

- **Ask questions** in issue comments
- **Tag instructors** (@karastoyanov, @rayapetkova) for guidance
- **Review existing PRs** to learn from others
- **Check documentation** before asking

## 🎓 Learning Resources

### Git & GitHub
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Pro Git Book](https://git-scm.com/book/en/v2)

### Python
- [PEP 8 Style Guide](https://pep8.org/)
- [Python Documentation](https://docs.python.org/3/)
- [Black Code Formatter](https://black.readthedocs.io/)

### JavaScript/TypeScript
- [MDN Web Docs](https://developer.mozilla.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📌 Important Notes

- **Never commit sensitive data** (passwords, API keys, tokens)
- **Don't push directly to master** - always use pull requests
- **Keep PRs focused** - one feature or fix per PR
- **Update your branch** regularly to avoid merge conflicts
- **Test before submitting** - ensure your code works
- **Be patient** - code review takes time

## 🙏 Thank You

Your contributions help make SkillForge better and provide valuable learning experiences for the entire UTP community. Happy coding! 🚀

---

*This guide is a living document. If you have suggestions for improvements, please submit a PR!*
