# E2E Testing with Playwright

## Setup

Playwright is configured to test the BrokerFlow CRM frontend application.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (debug)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Generate test report
npm run test:e2e:report
```

## Environment Variables

Create `.env.test` for test credentials:

```env
TEST_USER_EMAIL=test@brokerflow.com
TEST_USER_PASSWORD=Test@123
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Test Structure

- `e2e/auth.spec.ts` - Authentication flows (login, logout)
- `e2e/leads.spec.ts` - Lead management (CRUD operations)

## Writing New Tests

1. Create test file in `e2e/` directory
2. Import test utilities: `import { test, expect } from '@playwright/test';`
3. Use `test.describe` for grouping tests
4. Use `test.beforeEach` for setup (e.g., authentication)
5. Write assertions with `expect()`

## Best Practices

- Use data-testid attributes for reliable selectors
- Clean up test data after tests
- Use environment variables for credentials
- Keep tests independent and isolated
- Use Page Object Model for complex pages

## CI/CD Integration

Tests run automatically on GitHub Actions:
- Triggered on PR and push to main
- Screenshots captured on failure
- HTML report generated as artifact
