# Development Guidelines

## Git Hooks

This project uses Git hooks to enforce code quality standards. These hooks are managed by [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged).

### Pre-commit Hook

The pre-commit hook runs automatically before each commit and performs the following tasks:

1. Lints only the staged TypeScript/TSX files using ESLint
2. Runs tests related to the changed files

This ensures that:
- Code formatting and style are consistent
- No linting errors are introduced
- Tests pass for the code being changed

### Pre-push Hook

The pre-push hook runs automatically before pushing code to the remote repository and performs:

1. Full linting of the entire codebase
2. Runs all tests with coverage reporting

This ensures that:
- The entire codebase is consistent
- All tests are passing
- No regressions have been introduced

## Bypass Hooks (Not Recommended)

In rare cases, you may need to bypass these hooks:

```bash
# Bypass pre-commit hook
git commit -m "Your message" --no-verify

# Bypass pre-push hook
git push --no-verify
```

**Note:** Bypassing hooks should be done only in exceptional circumstances and is not recommended for normal development workflow.

## Manual Code Quality Checks

You can also run these checks manually:

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
``` 