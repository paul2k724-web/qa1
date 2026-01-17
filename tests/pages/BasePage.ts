import { Page, Locator } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(path: string = '') {
        await this.page.goto(path);
    }

    async getCartCount(): Promise<string | null> {
        return this.page.locator('[data-testid="cart-count"]').textContent();
    }

    async openCart() {
        await this.page.locator('.cart-icon').click();
    }
}
