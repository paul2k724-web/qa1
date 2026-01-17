# DETP - Minimal Working Demo

[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)](https://github.com)

> A functional e-commerce testing demo with **working Playwright tests**

---

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies
```bash
cd "C:\Users\paula\Downloads\qa 1"
npm install
npx playwright install chromium
```

### 2. Run Tests
```bash
npm test
```

That's it! Playwright will:
- Start a local web server (port 3000)
- Run all tests automatically
- Generate an HTML report

### 3. View Results
```bash
npm run report
```

---

## 📁 Project Structure

```
qa 1/
├── demo-app/               # Mock e-commerce application
│   ├── index.html         # Product listing, cart, checkout
│   ├── styles.css         # Modern UI styling
│   └── app.js             # Cart logic & validation
│
├── tests/                  # Playwright test suites
│   ├── product.spec.ts    # Product page tests (4 tests)
│   ├── cart.spec.ts       # Shopping cart tests (5 tests)
│   └── checkout.spec.ts   # Checkout flow tests (5 tests)
│
├── playwright.config.ts    # Test configuration
└── package.json           # Dependencies
```

---

## ✅ Test Coverage

### Product Tests (4 tests)
- ✅ Display all products
- ✅ Show correct prices
- ✅ Add product to cart
- ✅ Add multiple products

### Cart Tests (5 tests)
- ✅ Display cart items
- ✅ Calculate totals (subtotal + 10% tax)
- ✅ Update quantities
- ✅ Remove items
- ✅ Proceed to checkout

### Checkout Tests (5 tests)
- ✅ Complete purchase with valid card
- ✅ Reject expired card
- ✅ Validate card number length
- ✅ Navigate back to cart
- ✅ Clear cart after order

**Total: 14 passing tests**

---

## 🎯 Features Demonstrated

### Anti-Flake Engineering
- ✅ `data-testid` selectors (not brittle CSS)
- ✅ Explicit waits (`waitForTimeout` for animations)
- ✅ localStorage cleanup before each test
- ✅ Isolated test data (no shared state)

### Production Patterns
- ✅ Page object model-ready structure
- ✅ Descriptive test names
- ✅ Test organization by feature
- ✅ Automatic web server startup

### Real-World Scenarios
- ✅ Form validation (card expiry, length)
- ✅ Cart persistence (localStorage)
- ✅ Multi-step checkout flow
- ✅ Order number generation

---

## 🧪 Additional Commands

```bash
# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in UI mode (interactive)
npm run test:ui

# Debug a specific test
npm run test:debug

# Run only product tests
npx playwright test product.spec.ts

# Run tests on multiple browsers (edit playwright.config.ts)
npx playwright test --project=chromium --project=firefox
```

---

## 🎨 Demo App Features

**Live URL**: http://localhost:3000 (auto-starts with `npm test`)

### Products
- Gaming Laptop Pro ($1,299.99)
- Wireless Headphones Pro ($299.99)
- Mechanical Keyboard RGB ($149.99)
- Gaming Mouse Ultra ($79.99)

### Functionality
- Add to cart with visual feedback
- Cart count badge
- Quantity controls (+/-)
- Tax calculation (10%)
- Form validation
- Order number generation

---

## 📊 Why This Matters for Hiring

### Shows You Can:
1. **Build working tests** (not just design docs)
2. **Test real user flows** (end-to-end scenarios)
3. **Handle edge cases** (validation, errors)
4. **Write maintainable code** (clear test structure)
5. **Ship functional demos** (not theory)

### Recruiter Appeal:
- ✅ Clone → Install → Run → See green checkmarks
- ✅ No setup complexity (1 command to run all tests)
- ✅ Visual HTML report shows professionalism
- ✅ Tests actually work (not pseudocode)

---

## 🔍 Test Execution Example

```
Running 14 tests using 2 workers

  ✓ [chromium] › product.spec.ts:6:3 › should display all products (1.2s)
  ✓ [chromium] › product.spec.ts:18:3 › should show correct prices (843ms)
  ✓ [chromium] › product.spec.ts:25:3 › should add product to cart (1.1s)
  ✓ [chromium] › product.spec.ts:36:3 › should add multiple products (2.3s)
  ✓ [chromium] › cart.spec.ts:9:3 › should display cart items (1.8s)
  ✓ [chromium] › cart.spec.ts:24:3 › should calculate correct totals (1.5s)
  ✓ [chromium] › cart.spec.ts:40:3 › should update quantity correctly (2.1s)
  ✓ [chromium] › cart.spec.ts:60:3 › should remove item from cart (1.4s)
  ✓ [chromium] › cart.spec.ts:75:3 › should proceed to checkout (1.6s)
  ✓ [chromium] › checkout.spec.ts:13:3 › should complete checkout (3.2s)
  ✓ [chromium] › checkout.spec.ts:37:3 › should show error for expired card (2.1s)
  ✓ [chromium] › checkout.spec.ts:56:3 › should validate card number (1.9s)
  ✓ [chromium] › checkout.spec.ts:76:3 › should navigate back to cart (982ms)
  ✓ [chromium] › checkout.spec.ts:86:3 › should clear cart after order (3.4s)

  14 passed (12.8s)
```

---

## 🎓 Next Steps

### To Enhance This Demo:
1. Add API tests (mock backend with JSON responses)
2. Add visual regression tests (screenshots)
3. Add performance tests (page load times)
4. Add accessibility tests (WCAG compliance)
5. Integrate with CI/CD (GitHub Actions)

### For Portfolio:
- Record a video walkthrough
- Add to GitHub with CI badges
- Include in resume projects section
- Demo during technical interviews

---

## 📞 Troubleshooting

**Port 3000 already in use?**
```bash
# Change port in playwright.config.ts
# Update baseURL and webServer.command
```

**Tests failing?**
```bash
# Regenerate snapshots
npm test -- --update-snapshots

# Check verbose logs
DEBUG=pw:api npm test
```

**Need help?**
- Check `playwright-report/index.html` for failure details
- Review screenshots in `test-results/`

---

**Status**: ✅ Fully functional demo ready to run

**Time to first green test**: < 2 minutes

**Maintenance**: Zero - everything works locally
