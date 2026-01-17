import { test, expect } from '@playwright/test';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('Checkout Flow Tests', () => {
    let productPage: ProductPage;
    let cartPage: CartPage;
    let checkoutPage: CheckoutPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);

        await productPage.navigate();
        await page.evaluate(() => localStorage.clear());

        await productPage.addProductToCart('laptop');
        await productPage.openCart();
        await cartPage.proceedToCheckout();
    });

    test('should complete checkout with valid payment info', async () => {
        await checkoutPage.fillPaymentInfo({
            cardNumber: '4242424242424242',
            expiry: '12/26',
            cvv: '123',
            name: 'John Doe'
        });

        await checkoutPage.fillBillingInfo({
            address: '123 Test Street',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105'
        });

        await checkoutPage.submitOrder();

        await expect(checkoutPage.successMessage).toBeVisible({ timeout: 10000 });
        await expect(checkoutPage.orderNumber).toContainText('ORD-');
    });

    test('should show error for expired card', async () => {
        await checkoutPage.fillPaymentInfo({
            cardNumber: '4242424242424242',
            expiry: '01/20',
            cvv: '123',
            name: 'Jane Doe'
        });

        await checkoutPage.fillBillingInfo({
            address: '456 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
        });

        await checkoutPage.submitOrder();

        await expect(checkoutPage.cardError).toBeVisible({ timeout: 5000 });
        await expect(checkoutPage.cardError).toContainText('expired');
    });

    test('should validate card number length', async () => {
        await checkoutPage.fillPaymentInfo({
            cardNumber: '4242424242',
            expiry: '12/26',
            cvv: '123',
            name: 'Test User'
        });

        await checkoutPage.fillBillingInfo({
            address: '789 Oak Ave',
            city: 'Austin',
            state: 'TX',
            zip: '78701'
        });

        await checkoutPage.submitOrder();

        await expect(checkoutPage.cardError).toBeVisible({ timeout: 5000 });
        await expect(checkoutPage.cardError).toContainText('16 digits');
    });

    test('should navigate back to cart from checkout', async () => {
        await checkoutPage.backToCart();
        await expect(cartPage.cartItems).toBeVisible();
    });

    test('should clear cart after successful order', async () => {
        await checkoutPage.fillPaymentInfo({
            cardNumber: '4242424242424242',
            expiry: '12/26',
            cvv: '456',
            name: 'Alice Smith'
        });
        await checkoutPage.fillBillingInfo({
            address: '321 Elm St',
            city: 'Seattle',
            state: 'WA',
            zip: '98101'
        });

        await checkoutPage.submitOrder();
        await expect(checkoutPage.successMessage).toBeVisible();
        expect(await checkoutPage.getCartCount()).toBe('0');
    });
});
