import { test, expect } from '@playwright/test';
import { ProductPage } from './pages/ProductPage';

test.describe('Product Page Tests', () => {
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await productPage.navigate();
    });

    test('should display all products on homepage', async ({ page }) => {
        await expect(page).toHaveTitle(/TechStore/);
        await expect(productPage.getProductCard('product-laptop')).toBeVisible();
        await expect(productPage.getProductCard('product-headphones')).toBeVisible();
        await expect(productPage.getProductCard('product-keyboard')).toBeVisible();
        await expect(productPage.getProductCard('product-mouse')).toBeVisible();
    });

    test('should show correct product prices', async () => {
        expect(await productPage.getProductPrice('laptop')).toContain('$1,299.99');
        expect(await productPage.getProductPrice('headphones')).toContain('$299.99');
        expect(await productPage.getProductPrice('keyboard')).toContain('$149.99');
        expect(await productPage.getProductPrice('mouse')).toContain('$79.99');
    });

    test('should add product to cart successfully', async () => {
        expect(await productPage.getCartCount()).toBe('0');
        await productPage.addProductToCart('laptop');
        expect(await productPage.getCartCount()).toBe('1');
    });

    test('should add multiple products to cart', async () => {
        await productPage.addProductToCart('headphones');
        await productPage.addProductToCart('keyboard');
        await productPage.addProductToCart('mouse');
        expect(await productPage.getCartCount()).toBe('3');
    });
});
