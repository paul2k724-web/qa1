import { test, expect } from '@playwright/test';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';

test.describe('Shopping Cart Tests', () => {
    let productPage: ProductPage;
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        cartPage = new CartPage(page);
        await productPage.navigate();
        await page.evaluate(() => localStorage.clear());
    });

    test('should display cart items after adding products', async () => {
        await productPage.addProductToCart('laptop');
        await productPage.addProductToCart('headphones');
        await productPage.openCart();

        await expect(cartPage.getCartItem('LAPTOP-001')).toBeVisible();
        await expect(cartPage.getCartItem('HEADPHONES-001')).toBeVisible();
    });

    test('should calculate correct cart totals', async () => {
        await productPage.addProductToCart('laptop');
        await productPage.openCart();

        await expect(cartPage.subtotal).toBeVisible();
        await expect(cartPage.subtotal).toContainText('$1,299.99', { timeout: 10000 });
        await expect(cartPage.tax).toContainText('$130.00');
        await expect(cartPage.total).toContainText('$1,429.99');
    });

    test('should update quantity correctly', async () => {
        await productPage.addProductToCart('keyboard');
        await productPage.openCart();

        await expect(cartPage.page.locator('[data-testid="quantity-KEYBOARD-001"]')).toHaveText('1');
        await cartPage.updateQuantity('KEYBOARD-001', 'increase');
        await cartPage.updateQuantity('KEYBOARD-001', 'increase');

        await expect(cartPage.page.locator('[data-testid="quantity-KEYBOARD-001"]')).toHaveText('3');
        await expect(cartPage.subtotal).toContainText('$449.97');
    });

    test('should remove item from cart', async ({ page }) => {
        await productPage.addProductToCart('mouse');
        await productPage.openCart();
        await cartPage.removeItem('MOUSE-001');

        await expect(page.locator('#products')).toBeVisible();
    });

    test('should proceed to checkout from cart', async () => {
        await productPage.addProductToCart('headphones');
        await productPage.openCart();
        await cartPage.proceedToCheckout();

        await expect(cartPage.page.locator('#checkout')).toBeVisible();
    });
});
