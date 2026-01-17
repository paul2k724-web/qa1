import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
    readonly cartItems: Locator;
    readonly subtotal: Locator;
    readonly tax: Locator;
    readonly total: Locator;
    readonly checkoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.cartItems = page.locator('[data-testid="cart-items"]');
        this.subtotal = page.locator('[data-testid="cart-subtotal"]');
        this.tax = page.locator('[data-testid="cart-tax"]');
        this.total = page.locator('[data-testid="cart-total"]');
        this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    }

    getCartItem(sku: string): Locator {
        return this.page.locator(`[data-testid="cart-item-${sku}"]`);
    }

    async updateQuantity(sku: string, change: 'increase' | 'decrease') {
        const item = this.getCartItem(sku);
        const buttonIndex = change === 'increase' ? ':last-child' : ':first-child';
        await item.locator(`.quantity-btn${buttonIndex}`).click();
    }

    async removeItem(sku: string) {
        await this.page.locator(`[data-testid="remove-${sku}"]`).click();
    }

    async proceedToCheckout() {
        await this.checkoutButton.click();
    }
}
