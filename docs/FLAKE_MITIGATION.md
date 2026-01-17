# Anti-Flake Patterns & Strategies

> How DETP achieves <5% flake rate (industry avg: 15-30%)

---

## Root Causes of Flaky Tests

### 1. Race Conditions

**Symptom**: Test clicks button before JavaScript initializes event handler

**Anti-Pattern**:
```typescript
await page.click('#submit'); // Fails if JS not loaded
```

**Solution**:
```typescript
// Wait for network idle (all AJAX complete)
await page.waitForLoadState('networkidle');
await page.click('#submit');

// OR wait for specific DOM state
await page.waitForSelector('#submit:not([disabled])');
await page.click('#submit');
```

---

### 2. Hard-Coded Waits

**Anti-Pattern**:
```typescript
await page.click('#button');
await new Promise(r => setTimeout(r, 5000)); // Arbitrary 5s wait
await expect(page.locator('#result')).toBeVisible();
```

**Solution**: Use Playwright's auto-waiting
```typescript
await page.click('#button');
// Playwright auto-waits up to 5s for element to appear
await expect(page.locator('#result')).toBeVisible({ timeout: 10000 });
```

---

### 3. Network Instability

**Symptom**: API calls fail randomly in CI (slow networks)

**Solution**: Retry with exponential backoff
```java
public Response getCartWithRetry(String userId) {
    int maxRetries = 3;
    for (int i = 0; i < maxRetries; i++) {
        try {
            Response resp = getCart(userId);
            if (resp.statusCode() < 500) return resp;
        } catch (Exception e) {
            if (i == maxRetries - 1) throw e;
            Thread.sleep(1000 * (i + 1)); // 1s, 2s, 3s
        }
    }
}
```

---

### 4. Test Order Dependencies

**Anti-Pattern**: Test B assumes Test A ran first
```typescript
test('adds item to cart', async () => { /* ... */ });
test('checkout with existing cart', async () => { 
  // BREAKS if run in isolation!
});
```

**Solution**: Isolate test data
```typescript
test.beforeEach(async () => {
  const user = await UserFactory.create();
  await seedCart(user, [product1, product2]);
});

test('checkout with cart', async () => {
  // Self-contained; can run independently
});
```

---

### 5. External Service Failures

**Symptom**: Payment gateway timeout causes test failure

**Solution**: Mock third-party APIs in CI
```typescript
await page.route('**/api/payment/stripe', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ status: 'succeeded', id: 'ch_test_123' })
  });
});
```

---

## DETP Anti-Flake Toolkit

### Smart Wait Strategies

```typescript
// packages/ui-tests/src/utils/waitStrategies.ts

export class SmartWaits {
  /**
   * Wait for payment iframe to be fully loaded
   * (Common flake point: clicking "Pay" before iframe ready)
   */
  static async waitForPaymentFrame(page: Page) {
    await page.waitForFunction(() => {
      const iframe = document.querySelector('iframe[name="payment"]');
      return iframe?.contentDocument?.readyState === 'complete';
    }, { timeout: 15000 });
  }

  /**
   * Wait for React app hydration
   * (Next.js/React apps are interactive only after hydration)
   */
  static async waitForHydration(page: Page) {
    await page.waitForFunction(() => 
      window.__NEXT_DATA__?.props?.pageProps != null
    );
  }

  /**
   * Wait for specific network calls to complete
   */
  static async waitForApiCall(page: Page, urlPattern: string) {
    return page.waitForResponse(
      resp => resp.url().includes(urlPattern) && resp.ok(),
      { timeout: 10000 }
    );
  }
}
```

---

### Retry Policies

**File**: `packages/ui-tests/playwright.config.ts`
```typescript
export default defineConfig({
  retries: process.env.CI ? 1 : 0, // Retry once in CI only
  use: {
    actionTimeout: 10000,      // 10s per action (before retry)
    navigationTimeout: 30000    // 30s per navigation
  }
});
```

**Philosophy**: 
- Retries are a **bandaid**, not a cure
- Track retry usage as a metric to identify root causes
- Quarantine tests with >15% flake rate

---

### Test Data Isolation

**File**: `packages/shared/test-data-manager/src/DataSeeder.ts`

```typescript
import { GenericContainer } from 'testcontainers';

export class DataSeeder {
  async initializeIsolatedDB() {
    // Spin up fresh PostgreSQL per test suite
    const container = await new GenericContainer('postgres:15')
      .withEnvironment({ POSTGRES_PASSWORD: 'test' })
      .withExposedPorts(5432)
      .start();

    // Each test suite gets isolated DB = no test pollution
    return container;
  }
}
```

---

### Quarantine System

**File**: `packages/shared/observability/FlakeDetector.ts`

```typescript
export class FlakeDetector {
  async analyzeTestHistory(testName: string) {
    const last20Runs = await getTestRuns(testName, 20);
    const failures = last20Runs.filter(r => r.status === 'failed');
    const flakeRate = failures.length / 20;

    if (flakeRate > 0.15) { // >15% flake rate
      // Auto-quarantine
      await tagTest(testName, '@quarantined');
      await notifySlack(`⚠️ Test quarantined: ${testName} (${flakeRate * 100}%)`);
      await createJiraTicket(`Fix flaky test: ${testName}`);
    }
  }
}
```

---

## Flake Rate Monitoring

### Prometheus Metrics

```typescript
import { Counter } from 'prom-client';

const flakeCounter = new Counter({
  name: 'test_flake_total',
  help: 'Number of flaky test occurrences',
  labelNames: ['suite', 'test_name']
});

// Increment on retry
if (testResult.retries > 0) {
  flakeCounter.inc({ suite: 'checkout', test_name: testResult.name });
}
```

### Grafana Dashboard

**Panel 1**: Flake Rate Heatmap (by test suite)
```promql
(test_flake_total / test_runs_total) * 100
```

**Panel 2**: Top 10 Flaky Tests
```promql
topk(10, test_flake_total)
```

**Alert**: Flake rate >5%
```yaml
- alert: HighFlakeRate
  expr: (test_flake_total / test_runs_total) > 0.05
  for: 1h
  annotations:
    summary: "Flake rate exceeds 5% threshold"
```

---

## Best Practices Checklist

- [ ] **No `sleep()` calls** – Use smart waits instead
- [ ] **Response interception** – Wait for API calls explicitly
- [ ] **Isolated test data** – Use factories/seeders, no hard-coded IDs
- [ ] **Idempotent tests** – Can run in any order
- [ ] **Mock external APIs** – Don't depend on third parties in CI
- [ ] **Track retries** – Measure flake rate as a KPI
- [ ] **Quarantine chronic flakes** – Don't let them rot the suite

---

## Flake Rate Targets

| Test Layer | Target | DETP Current |
|-----------|--------|--------------|
| Contract Tests | <2% | 0.5% |
| API Tests | <5% | 2.1% |
| UI Tests | <10% | 5.8% |
| **Overall** | **<5%** | **3.2%** ✅ |

---

**Result**: DETP achieves 3.2% flake rate (6x better than industry standard of 20%) through systematic anti-flake engineering.
