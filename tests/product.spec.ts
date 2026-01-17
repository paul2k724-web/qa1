import { test, expect } from '@playwright/test';

test.describe('Product Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display all products on homepage', async ({ page }) => {
        // Verify page title
        await expect(page).toHaveTitle(/TechStore/);

        // Verify hero section
        await expect(page.locator('.hero h2')).toContainText('Premium Electronics');

        // Verify all 4 products are displayed
        await expect(page.locator('[data-testid="product-laptop"]')).toBeVisible();
        await expect(page.locator('[data-testid="product-headphones"]')).toBeVisible();
        await expect(page.locator('[data-testid="product-keyboard"]')).toBeVisible();
        await expect(page.locator('[data-testid="product-mouse"]')).toBeVisible();
    });

    test('should show correct product prices', async ({ page }) => {
        await expect(page.locator('[data-testid="product-laptop-price"]')).toContainText('$1,299.99');
        await expect(page.locator('[data-testid="product-headphones-price"]')).toContainText('$299.99');
        await expect(page.locator('[data-testid="product-keyboard-price"]')).toContainText('$149.99');
        await expect(page.locator('[data-testid="product-mouse-price"]')).toContainText('$79.99');
    });

    test('should add product to cart successfully', async ({ page }) => {
        // Verify cart starts empty
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0');

        // Add laptop to cart
        await page.locator('[data-testid="add-laptop"]').click();

        // Verify button feedback
        await expect(page.locator('[data-testid="add-laptop"]')).toContainText('Added');

        // Verify cart count updated
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    });

    test('should add multiple products to cart', async ({ page }) => {
        // Add multiple items
        await page.locator('[data-testid="add-headphones"]').click();
        await page.locator('[data-testid="add-keyboard"]').click();
        await page.locator('[data-testid="add-mouse"]').click();

        // Wait for animations
        await page.waitForTimeout(1500);

        // Verify cart count
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('3');
    });
});
