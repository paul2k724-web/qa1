import { test, expect, Page } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { UserFactory } from '@shared/test-data-manager';

/**
 * Critical Path: Checkout Flow
 * 
 * Business Impact: $2M+/year in revenue
 * SLA: Must maintain >99.9% availability
 * 
 * Anti-Flake Measures:
 * - Isolated test data (UserFactory)
 * - Network idle waits (no arbitrary sleeps)
 * - Response interception for API verification
 * - Retry-able assertions with explicit timeouts
 */

test.describe('Checkout Flow - Critical Path', () => {
  let testUser: any;

  test.beforeEach(async ({ page }, testInfo) => {
    // Create isolated user with valid payment method
    testUser = await UserFactory.createWithCreditCard();
    
    // Inject auth token (bypass login flow for speed)
    await page.context().addCookies([{
      name: 'auth_token',
      value: testUser.authToken,
      domain: process.env.BASE_URL || 'localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    }]);

    console.log(`[${testInfo.title}] Test user: ${testUser.id}`);
  });

  test('should complete purchase with valid credit card @smoke @critical', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Step 1: Navigate to product and add to cart
    await test.step('Add product to cart', async () => {
      await productPage.goto('wireless-headphones-pro');
      await productPage.waitForProductLoaded();
      await productPage.addToCart();
      
      // Verify mini-cart updated
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    });

    // Step 2: Review cart
    await test.step('Review cart contents', async () => {
      await cartPage.goto();
      
      // Anti-flake: Wait for cart data to load (network idle)
      await page.waitForLoadState('networkidle');
      
      await expect(cartPage.itemCount).toHaveText('1');
      await expect(cartPage.totalPrice).toContainText('$299.99');
    });

    // Step 3: Proceed to checkout
    await test.step('Navigate to checkout', async () => {
      const checkoutPromise = page.waitForURL('**/checkout');
      await cartPage.proceedToCheckout();
      await checkoutPromise;
    });

    // Step 4: Fill payment details
    await test.step('Fill payment information', async () => {
      // Anti-flake: Wait for payment iframe to fully load
      await checkoutPage.waitForPaymentFrameReady();
      
      await checkoutPage.fillCreditCard({
        number: '4242424242424242', // Stripe test card
        expiry: '12/25',
        cvv: '123',
        name: testUser.name
      });

      await checkoutPage.fillBillingAddress({
        street: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105'
      });
    });

    // Step 5: Submit order
    await test.step('Submit and verify order', async () => {
      // Anti-flake: Intercept order creation API call
      const orderResponsePromise = page.waitForResponse(
        response => 
          response.url().includes('/api/orders') && 
          response.status() === 201,
        { timeout: 15000 }
      );

      await checkoutPage.submitOrder();
      
      const orderResponse = await orderResponsePromise;
      const orderData = await orderResponse.json();

      // Verify success message appears
      await expect(checkoutPage.successMessage).toBeVisible({ timeout: 10000 });
      await expect(checkoutPage.orderNumber).toMatch(/ORD-\d{8}/);

      // Verify order created in backend
      expect(orderData.orderId).toBeTruthy();
      expect(orderData.status).toBe('pending_fulfillment');
      expect(orderData.total).toBe(299.99);

      console.log(`Order created: ${orderData.orderId}`);
    });
  });

  test('should show validation error for expired card @negative', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await checkoutPage.goto();
    await checkoutPage.waitForPaymentFrameReady();

    await checkoutPage.fillCreditCard({
      number: '4242424242424242',
      expiry: '01/20', // Expired card
      cvv: '123',
      name: testUser.name
    });

    await checkoutPage.submitOrder();

    // Anti-flake: Use retryable assertion with explicit timeout
    await expect(checkoutPage.errorMessage).toContainText(
      /card.*expired/i,
      { timeout: 5000 }
    );

    // Verify form did not submit
    await expect(page).toHaveURL(/.*checkout.*/);
  });

  test('should preserve cart items across sessions @persistence', async ({ page, context }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    // Add item to cart
    await productPage.goto('laptop-ultra-15');
    await productPage.addToCart();

    // Get cart ID from cookies/localStorage
    const cartId = await page.evaluate(() => localStorage.getItem('cartId'));

    // Close page and create new one (simulate browser close)
    await page.close();
    const newPage = await context.newPage();

    // Navigate directly to cart
    const newCartPage = new CartPage(newPage);
    await newCartPage.goto();

    // Verify cart persisted
    await expect(newCartPage.itemCount).toHaveText('1');
    
    const restoredCartId = await newPage.evaluate(() => localStorage.getItem('cartId'));
    expect(restoredCartId).toBe(cartId);
  });

  test('should apply promo code correctly @promo', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Add product
    await productPage.goto('wireless-headphones-pro');
    await productPage.addToCart();
    await cartPage.goto();

    const originalPrice = await cartPage.getTotalPrice();

    // Proceed to checkout and apply promo
    await cartPage.proceedToCheckout();
    await checkoutPage.applyPromoCode('TESTDISCOUNT20');

    // Wait for price recalculation
    await page.waitForResponse(response => 
      response.url().includes('/api/promo/validate')
    );

    const discountedPrice = await checkoutPage.getTotalPrice();
    
    // Verify 20% discount applied
    expect(discountedPrice).toBeCloseTo(originalPrice * 0.8, 2);
    await expect(checkoutPage.discountBadge).toContainText('20% OFF');
  });

  test.afterEach(async ({}, testInfo) => {
    // Cleanup: Mark test user for deletion
    if (testUser) {
      await UserFactory.markForCleanup(testUser.id);
    }

    // Upload trace on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      console.error(`Test failed: ${testInfo.title}`);
      // Playwright auto-captures trace via config
    }
  });
});
