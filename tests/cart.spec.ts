import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear localStorage to start fresh
        await page.evaluate(() => localStorage.clear());
    });

    test('should display cart items after adding products', async ({ page }) => {
        // Add products to cart
        await page.locator('[data-testid="add-laptop"]').click();
        await page.waitForTimeout(500);
        await page.locator('[data-testid="add-headphones"]').click();
        await page.waitForTimeout(1000);

        // Open cart
        await page.locator('.cart-icon').click();

        // Verify cart items are displayed
        await expect(page.locator('[data-testid="cart-item-LAPTOP-001"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-item-HEADPHONES-001"]')).toBeVisible();
    });

    test('should calculate correct cart totals', async ({ page }) => {
        // Add laptop ($1,299.99)
        await page.locator('[data-testid="add-laptop"]').click();
        await page.waitForTimeout(1000);

        // Open cart
        await page.locator('.cart-icon').click();

        // Verify subtotal
        await expect(page.locator('[data-testid="cart-subtotal"]')).toContainText('$1,299.99');

        // Verify tax (10%)
        await expect(page.locator('[data-testid="cart-tax"]')).toContainText('$130.00');

        // Verify total
        await expect(page.locator('[data-testid="cart-total"]')).toContainText('$1,429.99');
    });

    test('should update quantity correctly', async ({ page }) => {
        // Add keyboard
        await page.locator('[data-testid="add-keyboard"]').click();
        await page.waitForTimeout(500);

        // Open cart
        await page.locator('.cart-icon').click();

        // Verify initial quantity
        await expect(page.locator('[data-testid="quantity-KEYBOARD-001"]')).toHaveText('1');

        // Increase quantity (click + button twice)
        await page.locator('[data-testid="cart-item-KEYBOARD-001"] .quantity-btn:last-child').click();
        await page.locator('[data-testid="cart-item-KEYBOARD-001"] .quantity-btn:last-child').click();

        // Verify updated quantity
        await expect(page.locator('[data-testid="quantity-KEYBOARD-001"]')).toHaveText('3');

        // Verify updated price (149.99 * 3 = 449.97)
        await expect(page.locator('[data-testid="cart-subtotal"]')).toContainText('$449.97');
    });

    test('should remove item from cart', async ({ page }) => {
        // Add mouse
        await page.locator('[data-testid="add-mouse"]').click();
        await page.waitForTimeout(500);

        // Open cart
        await page.locator('.cart-icon').click();

        // Verify item exists
        await expect(page.locator('[data-testid="cart-item-MOUSE-001"]')).toBeVisible();

        // Remove item
        await page.locator('[data-testid="remove-MOUSE-001"]').click();

        // Should redirect back to products (cart is empty)
        await expect(page.locator('#products')).toBeVisible();
    });

    test('should proceed to checkout from cart', async ({ page }) => {
        // Add item
        await page.locator('[data-testid="add-headphones"]').click();
        await page.waitForTimeout(500);

        // Open cart
        await page.locator('.cart-icon').click();

        // Click checkout button
        await page.locator('[data-testid="checkout-button"]').click();

        // Verify checkout page is shown
        await expect(page.locator('#checkout')).toBeVisible();
        await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
    });
});
