import { test, expect } from '@playwright/test';

test.describe('Checkout Flow Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());

        // Add a product and navigate to checkout
        await page.locator('[data-testid="add-laptop"]').click();
        await page.waitForTimeout(500);
        await page.locator('.cart-icon').click();
        await page.locator('[data-testid="checkout-button"]').click();
    });

    test('should complete checkout with valid payment info', async ({ page }) => {
        // Fill payment information
        await page.locator('[data-testid="card-number"]').fill('4242424242424242');
        await page.locator('[data-testid="card-expiry"]').fill('12/25');
        await page.locator('[data-testid="card-cvv"]').fill('123');
        await page.locator('[data-testid="card-name"]').fill('John Doe');

        // Fill billing address
        await page.locator('[data-testid="billing-address"]').fill('123 Test Street');
        await page.locator('[data-testid="billing-city"]').fill('San Francisco');
        await page.locator('[data-testid="billing-state"]').fill('CA');
        await page.locator('[data-testid="billing-zip"]').fill('94105');

        // Submit order
        await page.locator('[data-testid="submit-order"]').click();

        // Wait for processing
        await page.waitForTimeout(2000);

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('h2')).toContainText('Order Successful');

        // Verify order number format
        const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
        expect(orderNumber).toMatch(/ORD-\d{8}/);
    });

    test('should show error for expired card', async ({ page }) => {
        // Fill with expired card
        await page.locator('[data-testid="card-number"]').fill('4242424242424242');
        await page.locator('[data-testid="card-expiry"]').fill('01/20'); // Expired
        await page.locator('[data-testid="card-cvv"]').fill('123');
        await page.locator('[data-testid="card-name"]').fill('Jane Doe');

        // Fill address
        await page.locator('[data-testid="billing-address"]').fill('456 Main St');
        await page.locator('[data-testid="billing-city"]').fill('New York');
        await page.locator('[data-testid="billing-state"]').fill('NY');
        await page.locator('[data-testid="billing-zip"]').fill('10001');

        // Submit
        await page.locator('[data-testid="submit-order"]').click();

        // Verify error message
        await expect(page.locator('#card-error')).toContainText('expired', { timeout: 5000 });
    });

    test('should validate card number length', async ({ page }) => {
        // Fill with invalid card (too short)
        await page.locator('[data-testid="card-number"]').fill('4242424242');
        await page.locator('[data-testid="card-expiry"]').fill('12/25');
        await page.locator('[data-testid="card-cvv"]').fill('123');
        await page.locator('[data-testid="card-name"]').fill('Test User');

        // Fill address
        await page.locator('[data-testid="billing-address"]').fill('789 Oak Ave');
        await page.locator('[data-testid="billing-city"]').fill('Austin');
        await page.locator('[data-testid="billing-state"]').fill('TX');
        await page.locator('[data-testid="billing-zip"]').fill('78701');

        // Submit
        await page.locator('[data-testid="submit-order"]').click();

        // Verify error
        await expect(page.locator('#card-error')).toContainText('16 digits', { timeout: 5000 });
    });

    test('should navigate back to cart from checkout', async ({ page }) => {
        // Click back to cart button
        await page.locator('#back-to-cart').click();

        // Verify cart is displayed
        await expect(page.locator('#cart')).toBeVisible();
        await expect(page.locator('[data-testid="cart-items"]')).toBeVisible();
    });

    test('should clear cart after successful order', async ({ page }) => {
        // Complete checkout
        await page.locator('[data-testid="card-number"]').fill('4242424242424242');
        await page.locator('[data-testid="card-expiry"]').fill('12/26');
        await page.locator('[data-testid="card-cvv"]').fill('456');
        await page.locator('[data-testid="card-name"]').fill('Alice Smith');
        await page.locator('[data-testid="billing-address"]').fill('321 Elm St');
        await page.locator('[data-testid="billing-city"]').fill('Seattle');
        await page.locator('[data-testid="billing-state"]').fill('WA');
        await page.locator('[data-testid="billing-zip"]').fill('98101');

        await page.locator('[data-testid="submit-order"]').click();
        await page.waitForTimeout(2000);

        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Verify cart count is reset
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0');
    });
});
