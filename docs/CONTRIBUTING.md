# Contributing to DETP

Thank you for contributing to the Distributed E-Commerce Testing Platform! This guide will help you add new tests, fix flaky tests, and maintain the framework.

---

## Table of Contents

- [Adding New UI Tests](#adding-new-ui-tests)
- [Adding New API Tests](#adding-new-api-tests)
- [Adding Contract Tests](#adding-contract-tests)
- [Fixing Flaky Tests](#fixing-flaky-tests)
- [Code Review Guidelines](#code-review-guidelines)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Adding New UI Tests

### 1. Create a New Test File

```bash
cd packages/ui-tests/src/tests
touch feature-name.spec.ts
```

### 2. Follow the Template

```typescript
import { test, expect } from '@playwright/test';
import { FeaturePage } from '../pages/feature.page';
import { UserFactory } from '@shared/test-data-manager';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup isolated test data
    const user = await UserFactory.create();
    await authenticateUser(page, user);
  });

  test('should perform critical action @smoke', async ({ page }) => {
    const featurePage = new FeaturePage(page);
    
    await featurePage.performAction();
    
    await expect(featurePage.successMessage).toBeVisible();
  });

  test.afterEach(async () => {
    // Cleanup
    await UserFactory.cleanup();
  });
});
```

### 3. Create Page Object Model

```typescript
// packages/ui-tests/src/pages/feature.page.ts
import { Page, Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;
  readonly actionButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.actionButton = page.locator('[data-testid="action-button"]');
    this.successMessage = page.locator('[data-testid="success"]');
  }

  async performAction() {
    await this.page.waitForLoadState('networkidle');
    await this.actionButton.click();
  }
}
```

### 4. Anti-Flake Checklist

- [ ] No `sleep()` or `setTimeout()` – use smart waits
- [ ] Isolated test data (no hard-coded IDs)
- [ ] Wait for network idle before critical actions
- [ ] Use data-testid selectors (not brittle CSS)
- [ ] Add explicit timeouts to assertions
- [ ] Intercept API responses where needed

---

## Adding New API Tests

### 1. Create Test Class

```bash
cd packages/api-tests/src/test/java/feature
touch FeatureApiTest.java
```

### 2. Follow REST Assured Pattern

```java
package feature;

import io.restassured.RestAssured;
import org.junit.jupiter.api.*;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@DisplayName("Feature API Tests")
public class FeatureApiTest {
    
    private String userId;
    private String authToken;

    @BeforeEach
    public void setup() {
        var user = UserFactory.createUser();
        userId = user.getId();
        authToken = user.getAuthToken();
    }

    @Test
    @DisplayName("POST /feature - Should create resource")
    public void shouldCreateResource() {
        given()
            .header("Authorization", authToken)
            .contentType("application/json")
            .body("{\"name\":\"test\"}")
        .when()
            .post("/feature")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("name", equalTo("test"));
    }

    @AfterEach
    public void cleanup() {
        UserFactory.cleanup(userId);
    }
}
```

### 3. Add JSON Schema

```json
// packages/api-tests/src/test/resources/schemas/feature-response.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" }
  }
}
```

---

## Adding Contract Tests

### 1. Define Consumer Contract

```typescript
// packages/contract-tests/src/consumer/frontend-feature.pact.ts
import { Pact } from '@pact-foundation/pact';
import { like } from '@pact-foundation/pact/dsl/matchers';

describe('Frontend-FeatureAPI Contract', () => {
  test('returns feature data', async () => {
    await provider.addInteraction({
      state: 'feature exists',
      uponReceiving: 'request for feature',
      withRequest: {
        method: 'GET',
        path: '/feature/123'
      },
      willRespondWith: {
        status: 200,
        body: {
          id: like('123'),
          name: like('Feature Name')
        }
      }
    });

    // Test API client
    const data = await client.getFeature('123');
    expect(data.id).toBe('123');
  });
});
```

### 2. Verify Provider

```typescript
// packages/contract-tests/src/provider/feature-provider.spec.ts
import { Verifier } from '@pact-foundation/pact';

describe('Feature API Provider', () => {
  test('validates contracts', async () => {
    await new Verifier({
      provider: 'FeatureAPI',
      providerBaseUrl: 'http://localhost:8080',
      pactUrls: ['./pacts/frontend-featureapi.json']
    }).verifyProvider();
  });
});
```

---

## Fixing Flaky Tests

### 1. Identify the Flake

Check Grafana dashboard for flaky tests:
```
http://localhost:3000/d/test-metrics
```

Or query Prometheus:
```promql
topk(10, test_flake_total)
```

### 2. Reproduce Locally

```bash
# Run test 20 times to reproduce flake
npx playwright test flaky-test.spec.ts --repeat-each=20
```

### 3. Common Fixes

**Race Condition**:
```typescript
// Before (flaky)
await page.click('#button');
expect(data).toBe('expected');

// After (stable)
await page.click('#button');
await page.waitForResponse(resp => resp.url().includes('/api'));
expect(data).toBe('expected');
```

**Test Pollution**:
```typescript
// Before (flaky)
test('test 1', async () => {
  sharedData.value = 'A'; // Mutates shared state
});

// After (stable)
test.beforeEach(async () => {
  const isolatedData = DataFactory.create(); // Isolate
});
```

### 4. If Flake Persists: Quarantine

```typescript
test.skip('flaky test @quarantined', async ({ page }) => {
  // TODO: Fix race condition with payment iframe
});
```

Create ticket to fix properly later.

---

## Code Review Guidelines

### Must-Haves

- [ ] Tests pass locally (`npm run test:all`)
- [ ] No `console.log` (use proper logging)
- [ ] Follows Page Object Model (UI tests)
- [ ] JSON schema defined (API tests)
- [ ] Test is tagged (`@smoke`, `@regression`, etc.)
- [ ] Anti-flake patterns applied

### Nice-to-Haves

- [ ] Test execution <5s (UI), <2s (API)
- [ ] Inline comments for complex logic
- [ ] Adds observability (metrics, logging)

---

## CI/CD Pipeline

### Pipeline Stages

1. **Contract Tests** (~2min) – Runs first; blocks API changes
2. **API Tests** (~8min) – 4 parallel jobs
3. **UI Tests** (~12min) – 4 shards
4. **Quality Gate** – Flake rate check (<5%)

### Running Locally

```bash
# Simulate CI environment
export CI=true
npm run test:all
```

### Viewing Reports

```bash
# Allure HTML report
npm run report:allure

# Grafana dashboard
npm run metrics:start
# Visit http://localhost:3000
```

---

## Questions?

- **Slack**: #qa-automation
- **Wiki**: [DETP Documentation](./docs/)
- **Issues**: [GitHub Issues](https://github.com/org/detp/issues)

---

**Happy Testing!** 🚀
