# Contributing to LaundroLink

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Code of Conduct

- Be respectful and inclusive
- Give constructive feedback
- Help others learn
- Report issues privately

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Provide a clear title and description
3. Include steps to reproduce
4. Mention your environment (Node version, OS, etc.)

### Requesting Features

1. Describe what you need
2. Explain why it's important
3. Suggest how it might work
4. Consider alternatives

### Submitting Code

1. **Fork and clone** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make changes** and commit with clear messages:
   ```
   feat(auth): add session timeout after 24 hours
   fix(upload): validate image paths
   docs(readme): update installation guide
   ```
4. **Test locally**:
   ```bash
   npm install
   npm run check  # TypeScript verification
   npm run dev    # Test the feature
   ```
5. **Push and create a PR** with a detailed description

## Code Style

### TypeScript
- Use strict mode (enabled by default)
- Write explicit types for public APIs
- Avoid `any` unless absolutely necessary

### React Components
- Use functional components and hooks
- Extract complex logic into custom hooks
- Type all props

### Express Routes
- Use async/await
- Validate input with Zod schemas
- Handle errors with try/catch
- Return appropriate HTTP status codes

### Database
- Use parameterized queries (Drizzle ORM)
- Never use string concatenation for SQL
- Write migration-safe queries

## Commit Message Format

```
type(scope): subject

Optional detailed description
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
**Scope**: Feature or area affected
**Subject**: Imperative mood, no period, max 50 chars

Example:
```
feat(auth): add email verification
fix(upload): prevent path traversal attacks
docs(security): add authentication guide
```

## Pull Request Process

1. **Title**: Short, descriptive (under 70 chars)
2. **Description**:
   - What does this change do?
   - Why is it needed?
   - How was it tested?
3. **Checklist**:
   - [ ] Tests pass (`npm run check`)
   - [ ] No console errors
   - [ ] Documentation updated
   - [ ] Security implications reviewed

## Security Considerations

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate all user input
- Use parameterized queries
- Test security-critical code
- Document security implications in PR

## Testing

Run TypeScript checking before committing:
```bash
npm run check
```

Test your changes locally:
```bash
npm run dev
# Test the feature in your browser or API client
```

## Questions?

- Open a GitHub Discussion for questions
- Create an issue for bugs
- Ask for help in PRs if needed

---

Thank you for contributing to LaundroLink! 🎉
