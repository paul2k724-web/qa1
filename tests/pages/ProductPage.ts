import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
    readonly productCards: Locator;

    constructor(page: Page) {
        super(page);
        this.productCards = page.locator('.product-card');
    }

    getProductCard(testId: string): Locator {
        return this.page.locator(`[data-testid="${testId}"]`);
    }

    async addProductToCart(productId: string) {
        const addButton = this.page.locator(`[data-testid="add-${productId}"]`);
        await addButton.click();
        await expect(addButton).toContainText('Added');
    }

    async getProductPrice(productId: string): Promise<string | null> {
        return this.page.locator(`[data-testid="product-${productId}-price"]`).textContent();
    }
}
